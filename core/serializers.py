from rest_framework import serializers
from .models import Teacher, Homework, Gallery, ContactMessage, Result, Notice, SubjectResult, Student, Profile, HomeworkSubmission, ActivityLog, GalleryLike, GalleryComment, Subject, Marks, Resource
from django.contrib.auth.models import User

# Import website content serializers
from .serializers_website_content import AboutPageSerializer, CoreValueSerializer, AchievementSerializer, ContactInfoSerializer, SocialMediaSerializer, FacilitySerializer, BannerSerializer, WelcomeMessageSerializer, SchoolInfoSerializer

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role']

class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES)
    name = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=50)  # NEW: required username
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    student_class = serializers.CharField(max_length=20, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=100, required=False, allow_blank=True)
    # Add all student fields
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=10, required=False, allow_blank=True)
    symbol_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=200, required=False, allow_blank=True)
    parent_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    parent_contact = serializers.CharField(max_length=20, required=False, allow_blank=True)
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        from .models import StudentAccount, Student, Teacher
        if StudentAccount.objects.filter(username=value).exists() or Student.objects.filter(username=value).exists() or Teacher.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        role = validated_data['role']
        name = validated_data.get('name') or validated_data.get('full_name')
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
        profile = Profile.objects.create(user=user, role=role)
        if role == 'student':
            # Auto-generate unique symbol_number if not provided
            from .models import Student
            symbol_number = validated_data.get('symbol_number', '')
            if not symbol_number:
                # Find the highest existing symbol_number (as int), increment by 1
                last_student = Student.objects.order_by('-id').first()
                if last_student and last_student.symbol_number and last_student.symbol_number.isdigit():
                    symbol_number = str(int(last_student.symbol_number) + 1)
                else:
                    symbol_number = '1001'  # Start from 1001 if none exist
            student = Student.objects.create(
                user=user,  # Always set user
                profile=profile,
                username=username,
                full_name=validated_data.get('full_name', name),
                email=email,
                student_class=validated_data.get('student_class', ''),
                date_of_birth=validated_data.get('date_of_birth'),
                gender=validated_data.get('gender', ''),
                symbol_number=symbol_number,
                phone_number=validated_data.get('phone_number', ''),
                address=validated_data.get('address', ''),
                parent_name=validated_data.get('parent_name', ''),
                parent_contact=validated_data.get('parent_contact', ''),
                profile_photo=validated_data.get('profile_photo', None),
            )
            print(f"[DEBUG] Created Student: {student.full_name}, Linked User: {student.user}, Symbol Number: {student.symbol_number}")
            # Also create StudentAccount with plain password
            from .models import StudentAccount
            StudentAccount.objects.create(
                username=username,
                full_name=validated_data.get('full_name', name),
                password=password,  # plain text
                class_grade=validated_data.get('student_class', ''),
                email=email
            )
            return student
        elif role == 'teacher':
            teacher = Teacher.objects.create(
                profile=profile,
                username=username,
                full_name=name,
                subject=validated_data.get('subject', ''),
            )
            return teacher
        return profile

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'

class HomeworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = '__all__'

class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Gallery
        fields = '__all__'

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'

class ResourceSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class Meta:
        model = Resource
        fields = ['id', 'title', 'description', 'file', 'subject', 'subject_name', 'class_name', 'is_question_paper', 'tags', 'is_published', 'created_at']

class SubjectResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectResult
        fields = '__all__'  # This will now include theory/practical fields

class ResultSerializer(serializers.ModelSerializer):
    subjects = SubjectResultSerializer(many=True, read_only=True)
    class Meta:
        model = Result
        fields = '__all__'

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(max_length=50, required=True)

    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        from .models import StudentAccount, Student, Teacher
        if StudentAccount.objects.filter(username=value).exists() or Student.objects.filter(username=value).exists() or Teacher.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data['username']
        email = validated_data.get('email', '')
        user = User.objects.create_user(username=username, email=email, password=password)
        student = Student.objects.create(user=user, **validated_data)
        print(f"[DEBUG] Created Student: {student.full_name}, Linked User: {student.user}")
        return student 

    def update(self, instance, validated_data):
        # Ensure user is always linked
        if not instance.user and 'username' in validated_data:
            username = validated_data['username']
            user = User.objects.filter(username=username).first()
            if user:
                instance.user = user
        return super().update(instance, validated_data)

class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    homework_title = serializers.CharField(source='homework.title', read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = ['id', 'homework', 'homework_title', 'student', 'student_name', 'file', 'submitted_at', 'status', 'grade', 'feedback']
        read_only_fields = ['submitted_at', 'status', 'grade', 'feedback', 'student_name', 'homework_title'] 

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'

class GalleryLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryLike
        fields = '__all__'

class GalleryCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryComment
        fields = '__all__' 

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class MarksSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_symbol = serializers.CharField(source='student.symbol_number', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    credit_hour = serializers.FloatField(source='subject.credit_hour', read_only=True)
    
    class Meta:
        model = Marks
        fields = '__all__'

class StudentResultSerializer(serializers.ModelSerializer):
    """Serializer for complete student result with all subjects"""
    marks = MarksSerializer(many=True, read_only=True)
    total_marks = serializers.SerializerMethodField()
    total_percentage = serializers.SerializerMethodField()
    average_gpa = serializers.SerializerMethodField()
    result_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'symbol_number', 'student_class', 'marks', 'total_marks', 'total_percentage', 'average_gpa', 'result_status']
    
    def get_total_marks(self, obj):
        marks = obj.marks.all()
        return sum(mark.total_marks or 0 for mark in marks)
    
    def get_total_percentage(self, obj):
        marks = obj.marks.all()
        if not marks:
            return 0
        total_percentage = sum(mark.percentage or 0 for mark in marks)
        return total_percentage / len(marks)
    
    def get_average_gpa(self, obj):
        marks = obj.marks.all()
        if not marks:
            return 0
        total_gpa = sum(mark.grade_point or 0 for mark in marks)
        return total_gpa / len(marks)
    
    def get_result_status(self, obj):
        marks = obj.marks.all()
        if not marks:
            return 'No Data'
        passed_subjects = sum(1 for mark in marks if mark.is_passed)
        if passed_subjects == len(marks):
            return 'Pass'
        elif passed_subjects >= len(marks) * 0.6:  # 60% subjects passed
            return 'Conditional Pass'
        else:
            return 'Fail'