from django.core.management.base import BaseCommand
from core.models import Subject, Student, Marks
import random
from datetime import date

class Command(BaseCommand):
    help = 'Populate comprehensive test data for result management system'

    def handle(self, *args, **options):
        self.stdout.write('Creating comprehensive test data...')
        
        # Create subjects if they don't exist
        subjects_data = [
            {'name': 'English', 'credit_hour': 4.0},
            {'name': 'Mathematics', 'credit_hour': 5.0},
            {'name': 'Science', 'credit_hour': 5.0},
            {'name': 'Social Studies', 'credit_hour': 4.0},
            {'name': 'Computer Science', 'credit_hour': 3.0},
            {'name': 'Nepali', 'credit_hour': 4.0},
            {'name': 'Physics', 'credit_hour': 4.0},
            {'name': 'Chemistry', 'credit_hour': 4.0},
            {'name': 'Biology', 'credit_hour': 4.0},
            {'name': 'Economics', 'credit_hour': 3.0},
        ]
        
        subjects = []
        for subject_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                name=subject_data['name'],
                defaults={'credit_hour': subject_data['credit_hour']}
            )
            subjects.append(subject)
            if created:
                self.stdout.write(f'Created subject: {subject.name}')
        
        # Create students if they don't exist
        students_data = [
            {'full_name': 'Ram Kumar Shrestha', 'symbol_number': '12345678'},
            {'full_name': 'Sita Devi Tamang', 'symbol_number': '23456789'},
            {'full_name': 'Hari Bahadur Gurung', 'symbol_number': '34567890'},
            {'full_name': 'Gita Kumari Rai', 'symbol_number': '45678901'},
            {'full_name': 'Bikash Thapa', 'symbol_number': '56789012'},
            {'full_name': 'Anita Sharma', 'symbol_number': '67890123'},
            {'full_name': 'Rajesh Kumar Yadav', 'symbol_number': '78901234'},
            {'full_name': 'Puja Devi Karki', 'symbol_number': '89012345'},
            {'full_name': 'Suresh Magar', 'symbol_number': '90123456'},
            {'full_name': 'Laxmi Kumari Limbu', 'symbol_number': '01234567'},
        ]
        
        students = []
        for student_data in students_data:
            # Generate unique username
            username = f"student_{student_data['symbol_number']}"
            
            student, created = Student.objects.get_or_create(
                symbol_number=student_data['symbol_number'],
                defaults={
                    'username': username,
                    'full_name': student_data['full_name'],
                    'date_of_birth': date(2005, 1, 1),
                    'gender': 'Male' if 'Kumar' in student_data['full_name'] or 'Bahadur' in student_data['full_name'] else 'Female',
                    'student_class': '10',
                    'email': f"{student_data['full_name'].lower().replace(' ', '.')}@example.com",
                    'parent_name': f"Parent of {student_data['full_name']}",
                    'parent_contact': f"98{random.randint(10000000, 99999999)}"
                }
            )
            students.append(student)
            if created:
                self.stdout.write(f'Created student: {student.full_name} ({student.symbol_number})')
        
        # Create sample marks for each student and subject
        exam_types = ['Mid Term', 'Final Term']
        academic_years = ['2024-25']
        
        marks_created = 0
        for student in students:
            for subject in subjects:
                for exam_type in exam_types:
                    for academic_year in academic_years:
                        # Check if marks already exist
                        if not Marks.objects.filter(
                            student=student,
                            subject=subject,
                            exam_type=exam_type,
                            academic_year=academic_year
                        ).exists():
                            # Generate realistic marks
                            theory_marks = random.randint(60, 95)
                            practical_marks = random.randint(0, 20) if subject.name in ['Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology'] else 0
                            
                            marks = Marks.objects.create(
                                student=student,
                                subject=subject,
                                exam_type=exam_type,
                                academic_year=academic_year,
                                theory_marks=theory_marks,
                                practical_marks=practical_marks,
                                theory_total=100,
                                practical_total=20 if practical_marks > 0 else 0
                            )
                            marks_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {marks_created} marks records for {len(students)} students and {len(subjects)} subjects'
            )
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Test data ready! Access the system at: /comprehensive-result-management/'
            )
        ) 