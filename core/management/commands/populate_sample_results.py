from django.core.management.base import BaseCommand
from core.models import Result, Student
import random

class Command(BaseCommand):
    help = 'Populate sample results data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample results...')
        
        # Sample student names
        student_names = [
            "Hari Gautam", "Ramesh Thapa", "Garima Bhatta", "Sima Rana", 
            "Kiran Shrestha", "Shyam K.C", "Sita Gurung", "Ram Bahadur",
            "Laxmi Devi", "Bikash Thapa", "Anita Shrestha", "Prakash Karki"
        ]
        
        # Sample subjects and their marks
        subjects = {
            'nepali': (60, 95),
            'math': (50, 90),
            'science': (55, 88),
            'computer': (70, 95),
            'social': (65, 92)
        }
        
        exam_types = ['Final Term', 'Mid Term', 'Unit Test']
        classes = ['10', '9', '8']
        academic_years = ['2024-25', '2023-24']
        
        created_count = 0
        
        for i, name in enumerate(student_names):
            # Create result with realistic data
            total = 0
            subject_marks = {}
            
            # Generate random marks for each subject
            for subject, (min_marks, max_marks) in subjects.items():
                marks = random.randint(min_marks, max_marks)
                subject_marks[subject] = marks
                total += marks
            
            # Calculate percentage and GPA
            max_possible = len(subjects) * 100
            percentage = (total / max_possible) * 100
            
            # Calculate GPA based on percentage
            if percentage >= 90:
                gpa = 4.0
            elif percentage >= 80:
                gpa = 3.6
            elif percentage >= 70:
                gpa = 3.2
            elif percentage >= 60:
                gpa = 2.8
            elif percentage >= 50:
                gpa = 2.4
            elif percentage >= 40:
                gpa = 2.0
            elif percentage >= 20:
                gpa = 1.6
            else:
                gpa = 0.8
            
            # Create the result
            result = Result.objects.create(
                student_name=name,
                roll_number=f"R{i+1:03d}",
                student_class=random.choice(classes),
                total=total,
                gpa=gpa,
                percentage=percentage,
                exam_type=random.choice(exam_types),
                academic_year=random.choice(academic_years),
                total_subjects=len(subjects),
                passed_subjects=len([m for m in subject_marks.values() if m >= 40]),
                failed_subjects=len([m for m in subject_marks.values() if m < 40]),
                class_position=random.randint(1, len(student_names)),
                total_students=len(student_names),
                is_published=random.choice([True, False])
            )
            
            created_count += 1
            self.stdout.write(f'Created result for {name}: Total={total}, GPA={gpa:.2f}, Percentage={percentage:.2f}%')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} sample results!')
        ) 