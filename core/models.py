from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import uuid
import base36

# Import website content models
from .models_website_content import AboutPage, CoreValue, Achievement, ContactInfo, SocialMedia, Facility, Banner, WelcomeMessage, SchoolInfo

# Create your models here.

class Profile(models.Model):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Subject(models.Model):
    """Model to store subjects with their credit hours"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    credit_hour = models.FloatField(default=1.0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.credit_hour} credits)"
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a unique code based on name
            base_code = self.name.upper()[:3]
            counter = 0
            while True:
                if counter == 0:
                    self.code = base_code
                else:
                    self.code = f"{base_code}{counter}"
                
                # Check if this code already exists (excluding current instance)
                if not Subject.objects.filter(code=self.code).exclude(id=self.id).exists():
                    break
                counter += 1
        super().save(*args, **kwargs)

class Teacher(models.Model):
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=128)  # plain text for now, can be hashed later
    plain_password = models.CharField(max_length=128, blank=True)  # for admin reference
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, null=True, blank=True, related_name='teacher')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='teacher_profile')
    full_name = models.CharField(max_length=100, verbose_name='Full Name')
    address = models.CharField(max_length=200, blank=True)
    school_name = models.CharField(max_length=200, blank=True)
    subject = models.CharField(max_length=100)
    assigned_class = models.ForeignKey('ClassSection', on_delete=models.SET_NULL, null=True, blank=True, related_name='teachers')
    marital_status = models.CharField(max_length=50, blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    photo = models.ImageField(upload_to='teachers/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='teachers/covers/', blank=True, null=True)
    # New fields
    experience = models.PositiveIntegerField(blank=True, null=True, verbose_name='Experience (years)')
    education = models.CharField(max_length=200, blank=True, verbose_name='Qualification')
    POSITION_CHOICES = [
        ('Principal', 'Principal'),
        ('Vice Principal', 'Vice Principal'),
        ('Incharge', 'Incharge'),
        ('DI', 'DI'),
        ('Teacher', 'Teacher'),
        ('Other', 'Other'),
    ]
    position = models.CharField(max_length=30, choices=POSITION_CHOICES, default='Teacher', blank=True)
    custom_position = models.CharField(max_length=100, blank=True, verbose_name='Custom Position (if Other)')

    def __str__(self):
        return self.full_name

class Homework(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    assigned_class = models.CharField(max_length=20)
    due_date = models.DateField()
    file = models.FileField(upload_to='homework/', blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.assigned_class})"

class Gallery(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    image = models.ImageField(upload_to='gallery/', blank=True, null=True)
    video = models.FileField(upload_to='gallery/videos/', blank=True, null=True)
    caption = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    tags = models.CharField(max_length=200, blank=True, help_text='Comma-separated tags')
    STATUS_CHOICES = [
        ('Published', 'Published'),
        ('Draft', 'Draft'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Draft')
    upload_date = models.DateTimeField(auto_now_add=True)
    uploader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_gallery')

    def __str__(self):
        media_type = 'Video' if self.media_type == 'video' else 'Image'
        return self.caption or f"Gallery {media_type} {self.id}"
        
    @property
    def media_url(self):
        """Return the URL of the media file (image or video)"""
        if self.media_type == 'video' and self.video:
            return self.video.url
        elif self.media_type == 'image' and self.image:
            return self.image.url
        return None

class Resource(models.Model):
    """Study resources uploaded by admin: notes, question papers, PDFs."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='resources/')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    class_name = models.CharField(max_length=20, help_text='Target class/grade, e.g., 1-12')
    is_question_paper = models.BooleanField(default=False)
    tags = models.CharField(max_length=200, blank=True, help_text='Comma-separated tags')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title

class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} ({self.email})"

class Result(models.Model):
    student_name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=20)
    student_class = models.CharField(max_length=20)
    total = models.IntegerField()
    gpa = models.FloatField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Enhanced fields
    exam_type = models.CharField(max_length=50, choices=[
        ('Mid Term', 'Mid Term'),
        ('Final Term', 'Final Term'),
        ('Unit Test', 'Unit Test'),
        ('Pre-Board', 'Pre-Board'),
        ('Board Exam', 'Board Exam'),
        ('Other', 'Other'),
    ], default='Final Term')
    exam_date = models.DateField(null=True, blank=True)
    academic_year = models.CharField(max_length=20, default='2024-25')
    semester = models.CharField(max_length=20, blank=True, null=True)
    total_subjects = models.PositiveIntegerField(default=0)
    passed_subjects = models.PositiveIntegerField(default=0)
    failed_subjects = models.PositiveIntegerField(default=0)
    remarks = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False, help_text='Make result visible to students')
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Performance indicators
    class_position = models.PositiveIntegerField(null=True, blank=True)
    total_students = models.PositiveIntegerField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    
    class Meta:
        unique_together = ('roll_number', 'student_class', 'exam_type', 'academic_year')
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.student_name} - {self.student_class} - {self.exam_type}"

    def save(self, *args, **kwargs):
        # Auto-calculate percentage
        if self.total and self.total > 0 and self.gpa:
            self.percentage = (self.gpa / 4.0) * 100
        super().save(*args, **kwargs)

    def get_performance_status(self):
        """Get performance status based on GPA"""
        if self.gpa is None:
            return "Not Available"
        if self.gpa >= 3.6:
            return "Excellent"
        elif self.gpa >= 3.0:
            return "Good"
        elif self.gpa >= 2.0:
            return "Satisfactory"
        else:
            return "Needs Improvement"

class SubjectResult(models.Model):
    result = models.ForeignKey(Result, related_name='subjects', on_delete=models.CASCADE)
    subject_name = models.CharField(max_length=100)
    credit_hour = models.FloatField()
    
    # Theory section
    theory_marks = models.FloatField(null=True, blank=True)
    theory_grade = models.CharField(max_length=5, blank=True, null=True)
    theory_grade_point = models.FloatField(null=True, blank=True)
    theory_total = models.FloatField(null=True, blank=True, help_text='Total marks for theory')
    
    # Practical section
    practical_marks = models.FloatField(null=True, blank=True)
    practical_grade = models.CharField(max_length=5, blank=True, null=True)
    practical_grade_point = models.FloatField(null=True, blank=True)
    practical_total = models.FloatField(null=True, blank=True, help_text='Total marks for practical')
    
    # Combined/Total fields
    total_marks = models.FloatField(null=True, blank=True)
    total_obtained = models.FloatField(null=True, blank=True)
    grade_point = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=5, blank=True, null=True)
    final_grade = models.CharField(max_length=5, blank=True, null=True)
    remarks = models.CharField(max_length=50, blank=True, null=True)
    
    # Additional fields
    subject_code = models.CharField(max_length=20, blank=True, null=True)
    is_optional = models.BooleanField(default=False)
    is_passed = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('result', 'subject_name')
        ordering = ['subject_name']

    def __str__(self):
        return f"{self.result.student_name} - {self.subject_name}"

    def save(self, *args, **kwargs):
        # Check if theory marks are below pass mark (40% of theory total)
        theory_pass_mark = (self.theory_total or 100) * 0.4  # 40% pass mark
        theory_failed = (self.theory_marks or 0) < theory_pass_mark
        
        # If theory marks are below pass mark, mark entire result as NG
        if theory_failed:
            self.theory_grade = 'NG'
            self.theory_grade_point = 0.0
            self.practical_grade = 'NG'
            self.practical_grade_point = 0.0
            self.grade_point = 0.0
            self.final_grade = 'NG'
            self.is_passed = False
        else:
            # Auto-calculate grades and points normally
            if self.theory_marks is not None:
                self.theory_grade, self.theory_grade_point = self.get_grade_and_point(self.theory_marks)
            
            if self.practical_marks is not None:
                self.practical_grade, self.practical_grade_point = self.get_grade_and_point(self.practical_marks)
            
            # Calculate combined grade point
            if self.theory_grade_point is not None and self.practical_grade_point is not None:
                self.grade_point = (self.theory_grade_point + self.practical_grade_point) / 2
            elif self.theory_grade_point is not None:
                self.grade_point = self.theory_grade_point
            elif self.practical_grade_point is not None:
                self.grade_point = self.practical_grade_point
            
            # Set final grade based on combined grade point
            if self.grade_point is not None:
                self.final_grade, _ = self.get_grade_and_point(self.grade_point * 25)  # Convert to percentage scale
                self.is_passed = self.grade_point >= 2.0
            
        super().save(*args, **kwargs)
    
    def get_grade_and_point(self, marks):
        """Get grade and grade point based on marks"""
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

class Notice(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField()
    CATEGORY_CHOICES = [
        ("Exam", "Exam"),
        ("Holiday", "Holiday"),
        ("Announcement", "Announcement"),
        ("Other", "Other"),
    ]
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default="Other")
    important = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    attachment = models.FileField(upload_to='notices/attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.date}"

class Student(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, null=True, blank=True, related_name='student')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='student_profile')
    username = models.CharField(max_length=50, unique=True)  # Ensure unique and not null
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    student_class = models.CharField(max_length=20)
    class_section = models.ForeignKey('ClassSection', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    symbol_number = models.CharField(max_length=30, unique=True)
    email = models.EmailField(blank=True)  # No longer unique or required for login
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=200, blank=True)
    profile_photo = models.ImageField(upload_to='students/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='students/covers/', blank=True, null=True)
    parent_name = models.CharField(max_length=100)
    parent_contact = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.symbol_number})"
    
    def save(self, *args, **kwargs):
        if not self.symbol_number:
            self.symbol_number = self.generate_symbol_number()
        super().save(*args, **kwargs)
    
    def generate_symbol_number(self):
        """Generate a unique 8-digit numeric symbol number"""
        import random
        while True:
            # Generate 8-digit numeric number
            symbol = str(random.randint(10000000, 99999999))
            
            # Check if it already exists
            if not Student.objects.filter(symbol_number=symbol).exists():
                return symbol

class Marks(models.Model):
    """Model to store individual subject marks for students"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    exam_type = models.CharField(max_length=50, choices=[
        ('Mid Term', 'Mid Term'),
        ('Final Term', 'Final Term'),
        ('Unit Test', 'Unit Test'),
        ('Pre-Board', 'Pre-Board'),
        ('Board Exam', 'Board Exam'),
        ('Other', 'Other'),
    ], default='Final Term')
    academic_year = models.CharField(max_length=20, default='2024-25')
    
    # Theory marks
    theory_marks = models.FloatField(null=True, blank=True)
    theory_total = models.FloatField(default=100, help_text='Total marks for theory')
    
    # Practical marks
    practical_marks = models.FloatField(null=True, blank=True)
    practical_total = models.FloatField(default=0, help_text='Total marks for practical')
    
    # Calculated fields
    total_marks = models.FloatField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=5, blank=True, null=True)
    grade_point = models.FloatField(null=True, blank=True)
    is_passed = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('student', 'subject', 'exam_type', 'academic_year')
        ordering = ['student__full_name', 'subject__name']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} - {self.exam_type}"
    
    def save(self, *args, **kwargs):
        # Calculate total marks
        self.total_marks = (self.theory_marks or 0) + (self.practical_marks or 0)
        
        # Calculate percentage
        total_possible = (self.theory_total or 0) + (self.practical_total or 0)
        if total_possible > 0:
            self.percentage = (self.total_marks / total_possible) * 100
        else:
            self.percentage = 0
        
        # Check if theory marks are below pass mark (40% of theory total)
        theory_pass_mark = (self.theory_total or 100) * 0.4  # 40% pass mark
        theory_failed = (self.theory_marks or 0) < theory_pass_mark
        
        # If theory marks are below pass mark, mark entire result as NG
        if theory_failed:
            self.grade = 'NG'
            self.grade_point = 0.0
            self.is_passed = False
        else:
            # Calculate grade and grade point normally
            self.grade, self.grade_point = self.get_grade_and_point(self.percentage)
            # Determine if passed
            self.is_passed = self.grade_point >= 2.0
        
        super().save(*args, **kwargs)
    
    def get_grade_and_point(self, percentage):
        """Get grade and grade point based on percentage"""
        if percentage >= 90:
            return 'A+', 4.0
        if percentage >= 80:
            return 'A', 3.6
        if percentage >= 70:
            return 'B+', 3.2
        if percentage >= 60:
            return 'B', 2.8
        if percentage >= 50:
            return 'C+', 2.4
        if percentage >= 40:
            return 'C', 2.0
        if percentage >= 30:
            return 'D', 1.6
        return 'NG', 0.0

class HomeworkSubmission(models.Model):
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='homework/submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('graded', 'Graded'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    grade = models.CharField(max_length=10, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.full_name} - {self.homework.title}"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_key = models.CharField(max_length=64, blank=True, null=True)
    action = models.CharField(max_length=100)
    page = models.CharField(max_length=200, blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.timestamp}"

class StudentAccount(models.Model):
    username = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=100)
    password = models.CharField(max_length=128)  # plain text for now
    class_grade = models.CharField(max_length=20)
    email = models.EmailField(blank=True)  # No longer unique or required for login

    def __str__(self):
        return f"{self.full_name} ({self.username})"

class LeadershipMessage(models.Model):
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='leadership/', blank=True, null=True)
    message = models.TextField()
    order = models.PositiveIntegerField(default=0, help_text='Order of appearance')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Leadership Message'
        verbose_name_plural = 'Leadership Messages'

    def __str__(self):
        return f"{self.name} - {self.position}"

class ClassSection(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
        ('leave', 'Leave'),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    class_section = models.ForeignKey('ClassSection', on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='marked_attendance')
    remarks = models.TextField(blank=True)
    locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'date')
        ordering = ['-date', 'student']

    def __str__(self):
        return f"{self.student.full_name} - {self.date} - {self.status}"

class GalleryLike(models.Model):
    REACTION_CHOICES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('haha', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😡'),
    ]
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # for per-user like tracking
    session_key = models.CharField(max_length=64, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    reaction = models.CharField(max_length=10, choices=REACTION_CHOICES, default='like')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('gallery', 'user', 'session_key', 'ip_address')

    def __str__(self):
        return f"{self.gallery.caption} - {self.reaction}"

class GalleryComment(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='comments')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # New fields for profile pic support
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='gallery_comments')
    student = models.ForeignKey('Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='gallery_comments')
    teacher = models.ForeignKey('Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='gallery_comments')

    def __str__(self):
        return f"Comment by {self.name} on {self.gallery.caption}"

class StatusUpdate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='status_updates')
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to='status_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

class PostComment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.post}"

class Follow(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Question(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.full_name} - {self.created_at}"

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.question}"

class StatusLike(models.Model):
    status = models.ForeignKey('StatusUpdate', on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('status', 'user')

    def __str__(self):
        return f"{self.user.username} likes {self.status}"

class StatusComment(models.Model):
    status = models.ForeignKey('StatusUpdate', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.status}"

class ResultAnalytics(models.Model):
    """Model to store aggregated result statistics"""
    class_name = models.CharField(max_length=20)
    exam_type = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    total_students = models.PositiveIntegerField(default=0)
    passed_students = models.PositiveIntegerField(default=0)
    failed_students = models.PositiveIntegerField(default=0)
    average_gpa = models.FloatField(default=0.0)
    highest_gpa = models.FloatField(default=0.0)
    lowest_gpa = models.FloatField(default=0.0)
    pass_percentage = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('class_name', 'exam_type', 'academic_year')
        verbose_name_plural = 'Result Analytics'

    def __str__(self):
        return f"{self.class_name} - {self.exam_type} - {self.academic_year}"

class SubjectPerformance(models.Model):
    """Model to track subject-wise performance"""
    subject_name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=20)
    exam_type = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    total_students = models.PositiveIntegerField(default=0)
    passed_students = models.PositiveIntegerField(default=0)
    failed_students = models.PositiveIntegerField(default=0)
    average_marks = models.FloatField(default=0.0)
    highest_marks = models.FloatField(default=0.0)
    lowest_marks = models.FloatField(default=0.0)
    pass_percentage = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('subject_name', 'class_name', 'exam_type', 'academic_year')
        verbose_name_plural = 'Subject Performances'

    def __str__(self):
        return f"{self.subject_name} - {self.class_name} - {self.exam_type}"

class StudentPerformanceHistory(models.Model):
    """Model to track individual student performance over time"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='performance_history')
    exam_type = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    class_name = models.CharField(max_length=20)
    gpa = models.FloatField()
    total_marks = models.IntegerField()
    class_position = models.PositiveIntegerField(null=True, blank=True)
    total_students = models.PositiveIntegerField(null=True, blank=True)
    performance_status = models.CharField(max_length=20, choices=[
        ('Excellent', 'Excellent'),
        ('Good', 'Good'),
        ('Satisfactory', 'Satisfactory'),
        ('Needs Improvement', 'Needs Improvement'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'exam_type', 'academic_year')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.exam_type} - {self.academic_year}"

class ResultTemplate(models.Model):
    """Model to store result templates for different exam types"""
    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=50)
    class_name = models.CharField(max_length=20)
    subjects = models.JSONField(help_text='List of subjects with their credit hours and total marks')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.exam_type} - {self.class_name}"

class GradeScale(models.Model):
    """Model to define grade scales for different classes"""
    class_name = models.CharField(max_length=20)
    grade = models.CharField(max_length=5)
    min_marks = models.FloatField()
    max_marks = models.FloatField()
    grade_point = models.FloatField()
    description = models.CharField(max_length=50, blank=True)
    is_pass = models.BooleanField(default=True)

    class Meta:
        unique_together = ('class_name', 'grade')
        ordering = ['class_name', '-min_marks']

    def __str__(self):
        return f"{self.class_name} - {self.grade} ({self.min_marks}-{self.max_marks})"
