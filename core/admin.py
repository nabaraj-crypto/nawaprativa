from django.contrib import admin

# Import website content admin configurations
from .admin_website_content import AboutPageAdmin, CoreValueAdmin, AchievementAdmin, ContactInfoAdmin, SocialMediaAdmin, FacilityAdmin, BannerAdmin, WelcomeMessageAdmin, SchoolInfoAdmin
from .models import (
    Teacher, Homework, Gallery, ContactMessage, Result, Notice, SubjectResult, 
    Student, Profile, HomeworkSubmission, ActivityLog, StudentAccount, 
    LeadershipMessage, Attendance, ClassSection, GalleryLike, GalleryComment,
    ResultAnalytics, SubjectPerformance, StudentPerformanceHistory, 
    ResultTemplate, GradeScale, Subject, Marks, Resource
)
from django.utils.html import format_html
from django import forms
from django.utils import timezone
from django.db.models import Avg, Max, Min, Count
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.urls import path, reverse

SUBJECTS = [
    'English',
    'Nepali',
    'Math',
    'Science',
    'Social',
    'Computer',
]

def get_grade_and_point(marks):
    if marks is None:
        return '', None
    if marks >= 90:
        return 'A+', 4.0
    if marks >= 80:
        return 'A', 3.6
    if marks >= 70:
        return 'B+', 3.2
    if marks >= 60:
        return 'B', 2.8
    if marks >= 50:
        return 'C+', 2.4
    if marks >= 40:
        return 'C', 2.0
    if marks >= 30:
        return 'D', 1.6
    return 'NG', 0.0

class SubjectResultInline(admin.StackedInline):
    model = SubjectResult
    extra = 1
    readonly_fields = [
        'theory_grade', 'theory_grade_point',
        'practical_grade', 'practical_grade_point',
        'grade', 'grade_point', 'final_grade', 'remarks'
    ]
    fieldsets = [
        (None, {
            'fields': ('subject_name', 'credit_hour'),
        }),
        ('Theory Section', {
            'fields': ('theory_marks', 'theory_grade', 'theory_grade_point'),
        }),
        ('Practical Section', {
            'fields': ('practical_marks', 'practical_grade', 'practical_grade_point'),
        }),
        ('Final/Combined', {
            'fields': ('grade', 'grade_point', 'final_grade', 'remarks'),
        }),
    ]

    def save_new(self, form, commit=True):
        obj = super().save_new(form, commit=False)
        self._auto_calculate(obj)
        if commit:
            obj.save()
        return obj

    def save_existing(self, form, instance, commit=True):
        obj = super().save_existing(form, instance, commit=False)
        self._auto_calculate(obj)
        if commit:
            obj.save()
        return obj

    def _auto_calculate(self, obj):
        # Theory
        obj.theory_grade, obj.theory_grade_point = get_grade_and_point(obj.theory_marks)
        # Practical
        obj.practical_grade, obj.practical_grade_point = get_grade_and_point(obj.practical_marks)
        # Final/Combined
        total_marks = (obj.theory_marks or 0) + (obj.practical_marks or 0)
        max_parts = int(obj.theory_marks is not None) + int(obj.practical_marks is not None)
        avg_marks = total_marks / max_parts if max_parts else 0
        obj.grade, obj.grade_point = get_grade_and_point(avg_marks)
        obj.final_grade = obj.grade
        # Remarks
        if (obj.theory_marks is not None and obj.theory_marks < 40) or (obj.practical_marks is not None and obj.practical_marks < 40):
            obj.remarks = 'Failed'
        else:
            obj.remarks = 'Passed'

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            self._auto_calculate(obj)
            obj.save()
        formset.save_m2m()

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = (
        'student_name', 'roll_number', 'student_class', 'exam_type', 'academic_year',
        'gpa', 'percentage', 'class_position', 'is_published', 'uploaded_at'
    )
    search_fields = ('student_name', 'roll_number', 'student_class')
    list_filter = ('student_class', 'exam_type', 'academic_year', 'is_published', 'uploaded_at')
    readonly_fields = ('uploaded_at', 'percentage')
    inlines = [SubjectResultInline]
    actions = ['publish_results', 'unpublish_results', 'generate_analytics']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('student_name', 'roll_number', 'student_class', 'exam_type', 'academic_year')
        }),
        ('Exam Details', {
            'fields': ('exam_date', 'semester', 'total_subjects', 'passed_subjects', 'failed_subjects')
        }),
        ('Performance', {
            'fields': ('total', 'gpa', 'percentage', 'class_position', 'total_students')
        }),
        ('Publication', {
            'fields': ('is_published', 'published_at', 'published_by', 'remarks')
        }),
    )
    
    change_list_template = 'admin/core/result/enhanced_change_list.html'
    change_form_template = 'admin/core/result/change_form.html'
    
    class Media:
        css = {
            'all': ('admin/css/results_admin.css',)
        }
        js = ('admin/js/results_admin.js',)
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('spreadsheet/', self.admin_site.admin_view(self.spreadsheet_view), name='core_result_spreadsheet'),
            path('enhanced-marks-entry/', self.admin_site.admin_view(self.enhanced_marks_entry_view), name='core_result_enhanced_marks_entry'),
        ]
        return custom_urls + urls
    
    def changelist_view(self, request, extra_context=None):
        """Override changelist view to add custom navigation"""
        extra_context = extra_context or {}
        extra_context['show_enhanced_marks_entry'] = True
        extra_context['enhanced_marks_entry_url'] = 'enhanced-marks-entry/'
        return super().changelist_view(request, extra_context)
    
    def spreadsheet_view(self, request):
        """Custom spreadsheet view for bulk result management"""
        from django.shortcuts import render
        from .models import Result
        
        results = Result.objects.all().order_by('student_name')
        context = {
            'results': results,
            'title': 'Results Spreadsheet View',
            'opts': self.model._meta,
        }
        return render(request, 'admin/core/result/spreadsheet_view.html', context)
    
    def enhanced_marks_entry_view(self, request):
        """Enhanced marks entry view with class-wise and subject-wise organization"""
        from django.shortcuts import render
        from .models import Student, Subject
        
        # Get available classes
        classes = Student.objects.values_list('student_class', flat=True).distinct().order_by('student_class')
        
        # Get available subjects
        subjects = Subject.objects.filter(is_active=True).order_by('name')
        
        context = {
            'classes': classes,
            'subjects': subjects,
            'title': 'Enhanced Marks Entry System',
            'opts': self.model._meta,
        }
        return render(request, 'admin/core/result/enhanced_marks_entry.html', context)
    
    def publish_results(self, request, queryset):
        updated = queryset.update(
            is_published=True,
            published_at=timezone.now(),
            published_by=request.user
        )
        self.message_user(request, f'{updated} results have been published successfully.')
    publish_results.short_description = "Publish selected results"
    
    def unpublish_results(self, request, queryset):
        updated = queryset.update(
            is_published=False,
            published_at=None,
            published_by=None
        )
        self.message_user(request, f'{updated} results have been unpublished.')
    unpublish_results.short_description = "Unpublish selected results"
    
    def generate_analytics(self, request, queryset):
        for result in queryset:
            analytics, created = ResultAnalytics.objects.get_or_create(
                class_name=result.student_class,
                exam_type=result.exam_type,
                academic_year=result.academic_year,
                defaults={
                    'total_students': 0,
                    'passed_students': 0,
                    'failed_students': 0,
                    'average_gpa': 0.0,
                    'highest_gpa': 0.0,
                    'lowest_gpa': 0.0,
                    'pass_percentage': 0.0
                }
            )
        
        # Update analytics for each class/exam combination
        for analytics in ResultAnalytics.objects.all():
            results = Result.objects.filter(
                class_name=analytics.class_name,
                exam_type=analytics.exam_type,
                academic_year=analytics.academic_year
            )
            
            analytics.total_students = results.count()
            analytics.passed_students = results.filter(gpa__gte=2.0).count()
            analytics.failed_students = results.filter(gpa__lt=2.0).count()
            analytics.average_gpa = results.aggregate(Avg('gpa'))['gpa__avg'] or 0.0
            analytics.highest_gpa = results.aggregate(Max('gpa'))['gpa__max'] or 0.0
            analytics.lowest_gpa = results.aggregate(Min('gpa'))['gpa__min'] or 0.0
            analytics.pass_percentage = (analytics.passed_students / analytics.total_students * 100) if analytics.total_students > 0 else 0.0
            analytics.save()
        
        self.message_user(request, 'Analytics generated successfully.')
    generate_analytics.short_description = "Generate analytics for selected results"

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'username', 'plain_password', 'user', 'subject', 'school_name', 'position', 'custom_position', 'experience', 'education', 'marital_status', 'contact_number', 'blood_group', 'profile')
    search_fields = ('full_name', 'username', 'subject', 'school_name', 'contact_number', 'blood_group', 'position', 'custom_position', 'education')
    list_filter = ('subject', 'marital_status', 'blood_group', 'position')
    fieldsets = (
        (None, {
            'fields': ('username', 'plain_password', 'full_name', 'user', 'profile', 'custom_position', 'subject', 'school_name', 'address', 'marital_status', 'contact_number', 'blood_group', 'photo', 'experience', 'education')
        }),
    )
    readonly_fields = ('user',)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['plain_password'].label = 'Login Password (for admin)'
        return form

    def save_model(self, request, obj, form, change):
        # Always sync Django user password with plain_password
        from core.models import Profile
        if obj.user and obj.plain_password:
            obj.user.set_password(obj.plain_password)
            obj.user.save()
        elif obj.plain_password:
            # If no user, create one
            from django.contrib.auth.models import User
            user, created = User.objects.get_or_create(
                username=obj.username,
                defaults={
                    'first_name': obj.full_name.split(' ')[0] if obj.full_name else '',
                    'last_name': ' '.join(obj.full_name.split(' ')[1:]) if obj.full_name and len(obj.full_name.split(' ')) > 1 else '',
                }
            )
            user.set_password(obj.plain_password)
            user.save()
            obj.user = user
        # Ensure a Profile with role='teacher' exists and is linked
        if obj.user:
            profile, _ = Profile.objects.get_or_create(user=obj.user, defaults={'role': 'teacher'})
            if profile.role != 'teacher':
                profile.role = 'teacher'
                profile.save()
            obj.profile = profile
        super().save_model(request, obj, form, change)
    class Media:
        js = ('core/admin_teacher.js',)

@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'caption', 'category', 'media_type', 'status', 'upload_date', 'tag_list')
    search_fields = ('caption', 'description', 'category', 'tags')
    list_filter = ('status', 'category', 'media_type', 'upload_date')
    readonly_fields = ('upload_date',)
    
    class Media:
        js = ('js/gallery_admin.js',)
    
    fieldsets = (
        ('Media', {
            'fields': ('media_type',),
            'description': 'Select the type of media you want to upload'
        }),
        ('Upload', {
            'fields': ('image', 'video'),
            'description': 'Upload either an image or video file based on the selected media type'
        }),
        ('Details', {
            'fields': ('caption', 'description', 'category', 'tags', 'status', 'upload_date', 'uploader')
        }),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if form.base_fields.get('video'):
            form.base_fields['video'].widget.attrs.update({
                'accept': 'video/mp4,video/webm,video/ogg,video/x-matroska'
            })
        if form.base_fields.get('image'):
            form.base_fields['image'].widget.attrs.update({
                'accept': 'image/jpeg,image/png,image/gif,image/webp'
            })
        return form
        
    def thumbnail(self, obj):
        if obj.media_type == 'video' and obj.video:
            return format_html('<div style="display:flex; align-items:center; gap:5px;"><i class="fas fa-video" style="font-size:16px;"></i> <span>Video</span></div>')
        elif obj.image:
            return format_html('<img src="{}" width="60" height="40" style="object-fit:cover; border-radius:6px;" />', obj.image.url)
        return ""
    thumbnail.short_description = 'Media'
    
    def tag_list(self, obj):
        return ', '.join([t.strip() for t in obj.tags.split(',') if t.strip()])
    tag_list.short_description = 'Tags'



@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'session_key', 'action', 'page', 'details')
    search_fields = ('user__username', 'session_key', 'action', 'page', 'details')
    list_filter = ('action', 'page', 'user')
    readonly_fields = ('timestamp', 'user', 'session_key', 'action', 'page', 'details')
    ordering = ('-timestamp',)

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'category', 'important')
    search_fields = ('title', 'content', 'category')
    list_filter = ('important', 'category', 'date')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    def user_password(self, obj):
        if obj.user:
            return obj.user.password
        return '(no user)'
    user_password.short_description = 'Password Hash'

    list_display = (
        'full_name', 'username', 'symbol_number', 'student_class', 'email', 'phone_number', 'parent_name', 'created_at', 'user_password'
    )
    search_fields = ('full_name', 'username', 'symbol_number', 'email', 'student_class', 'parent_name')
    list_filter = ('student_class', 'gender', 'created_at')
    readonly_fields = ('created_at', 'updated_at', 'user_password')
    fieldsets = (
        (None, {
            'fields': ('full_name', 'username', 'date_of_birth', 'gender', 'student_class', 'symbol_number', 'profile', 'user', 'profile_photo', 'user_password')
        }),
        ('Contact Info', {
            'fields': ('email', 'phone_number', 'address')
        }),
        ('Parent/Guardian', {
            'fields': ('parent_name', 'parent_contact')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )

@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_class', 'due_date', 'file')
    search_fields = ('title', 'assigned_class')
    list_filter = ('assigned_class', 'due_date')

@admin.register(StudentAccount)
class StudentAccountAdmin(admin.ModelAdmin):
    list_display = ('username', 'full_name', 'password', 'class_grade', 'email')
    search_fields = ('username', 'full_name', 'email', 'class_grade')
    list_filter = ('class_grade',)
    fields = ('username', 'full_name', 'password', 'class_grade', 'email')

@admin.register(LeadershipMessage)
class LeadershipMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'order')
    search_fields = ('name', 'position')
    list_editable = ('order',)
    ordering = ('order',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('date', 'student', 'status', 'marked_by', 'created_at')
    search_fields = ('student__full_name', 'student__symbol_number', 'marked_by__full_name')
    list_filter = ('date', 'status', 'marked_by')
    ordering = ('-date',)

@admin.register(ClassSection)
class ClassSectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')

# New admin classes for enhanced results functionality
@admin.register(ResultAnalytics)
class ResultAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('class_name', 'exam_type', 'academic_year', 'total_students', 'passed_students', 'failed_students', 'average_gpa', 'pass_percentage')
    list_filter = ('class_name', 'exam_type', 'academic_year')
    search_fields = ('class_name', 'exam_type', 'academic_year')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(SubjectPerformance)
class SubjectPerformanceAdmin(admin.ModelAdmin):
    list_display = ('subject_name', 'class_name', 'exam_type', 'academic_year', 'total_students', 'passed_students', 'average_marks', 'pass_percentage')
    list_filter = ('subject_name', 'class_name', 'exam_type', 'academic_year')
    search_fields = ('subject_name', 'class_name', 'exam_type', 'academic_year')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

@admin.register(StudentPerformanceHistory)
class StudentPerformanceHistoryAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam_type', 'academic_year', 'class_name', 'gpa', 'class_position', 'performance_status', 'created_at')
    list_filter = ('exam_type', 'academic_year', 'class_name', 'performance_status')
    search_fields = ('student__full_name', 'student__symbol_number', 'exam_type', 'academic_year')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

@admin.register(ResultTemplate)
class ResultTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam_type', 'class_name', 'is_active', 'created_at', 'created_by')
    list_filter = ('exam_type', 'class_name', 'is_active')
    search_fields = ('name', 'exam_type', 'class_name')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

@admin.register(GradeScale)
class GradeScaleAdmin(admin.ModelAdmin):
    list_display = ('class_name', 'grade', 'min_marks', 'max_marks', 'grade_point', 'is_pass', 'description')
    list_filter = ('class_name', 'is_pass')
    search_fields = ('class_name', 'grade', 'description')
    ordering = ('class_name', '-min_marks')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'credit_hour', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Marks)
class MarksAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'exam_type', 'academic_year', 'total_marks', 'percentage', 'grade', 'is_passed']
    list_filter = ['exam_type', 'academic_year', 'grade', 'is_passed', 'subject']
    search_fields = ['student__full_name', 'student__symbol_number', 'subject__name']
    ordering = ['student__full_name', 'subject__name']
    readonly_fields = ['total_marks', 'percentage', 'grade', 'grade_point', 'is_passed', 'created_at', 'updated_at']
    
    fieldsets = [
        ('Student & Subject', {
            'fields': ('student', 'subject', 'exam_type', 'academic_year')
        }),
        ('Theory Section', {
            'fields': ('theory_marks', 'theory_total')
        }),
        ('Practical Section', {
            'fields': ('practical_marks', 'practical_total')
        }),
        ('Calculated Results', {
            'fields': ('total_marks', 'percentage', 'grade', 'grade_point', 'is_passed'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    ]

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'class_name', 'subject', 'is_question_paper', 'is_published', 'created_at')
    list_filter = ('class_name', 'subject', 'is_question_paper', 'is_published')
    search_fields = ('title', 'description', 'tags')

# Register models that don't have @admin.register decorator
admin.site.register(ContactMessage)
admin.site.register(Profile)
admin.site.register(HomeworkSubmission)
admin.site.register(GalleryLike)
admin.site.register(GalleryComment)
