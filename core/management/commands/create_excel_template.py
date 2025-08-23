from django.core.management.base import BaseCommand
import pandas as pd
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Create a sample Excel template for results import'

    def handle(self, *args, **options):
        self.stdout.write('Creating Excel template...')
        
        # Sample data for template
        sample_data = [
            {
                'Student Name': 'Hari Gautam',
                'Roll Number': 'R001',
                'Class': '10',
                'Nepali': 85,
                'Math': 78,
                'Science': 82,
                'Computer': 90,
                'Social': 88,
                'Exam Type': 'Final Term',
                'Academic Year': '2024-25'
            },
            {
                'Student Name': 'Ramesh Thapa',
                'Roll Number': 'R002',
                'Class': '10',
                'Nepali': 92,
                'Math': 85,
                'Science': 88,
                'Computer': 95,
                'Social': 90,
                'Exam Type': 'Final Term',
                'Academic Year': '2024-25'
            },
            {
                'Student Name': 'Garima Bhatta',
                'Roll Number': 'R003',
                'Class': '10',
                'Nepali': 78,
                'Math': 82,
                'Science': 85,
                'Computer': 88,
                'Social': 80,
                'Exam Type': 'Final Term',
                'Academic Year': '2024-25'
            },
            {
                'Student Name': 'Sima Rana',
                'Roll Number': 'R004',
                'Class': '10',
                'Nepali': 88,
                'Math': 90,
                'Science': 92,
                'Computer': 85,
                'Social': 87,
                'Exam Type': 'Final Term',
                'Academic Year': '2024-25'
            },
            {
                'Student Name': 'Kiran Shrestha',
                'Roll Number': 'R005',
                'Class': '10',
                'Nepali': 75,
                'Math': 80,
                'Science': 78,
                'Computer': 85,
                'Social': 82,
                'Exam Type': 'Final Term',
                'Academic Year': '2024-25'
            }
        ]
        
        # Create DataFrame
        df = pd.DataFrame(sample_data)
        
        # Create Excel file with multiple sheets
        filename = f'results_template_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        filepath = os.path.join(os.getcwd(), filename)
        
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            # Main data sheet
            df.to_excel(writer, sheet_name='Results Data', index=False)
            
            # Instructions sheet
            instructions_data = [
                ['Instructions for Results Import'],
                [''],
                ['1. Fill in the student information in the "Results Data" sheet'],
                ['2. Enter marks for each subject (Nepali, Math, Science, Computer, Social)'],
                ['3. Marks should be between 0 and 100'],
                ['4. The system will automatically calculate totals, percentages, GPA, and grades'],
                ['5. Save the file and use the Import button in the admin interface'],
                [''],
                ['Required Columns:'],
                ['- Student Name: Full name of the student'],
                ['- Roll Number: Student roll number (e.g., R001)'],
                ['- Class: Student class (e.g., 10, 9, 8)'],
                ['- Nepali: Marks in Nepali subject'],
                ['- Math: Marks in Mathematics subject'],
                ['- Science: Marks in Science subject'],
                ['- Computer: Marks in Computer subject'],
                ['- Social: Marks in Social Studies subject'],
                ['- Exam Type: Type of exam (e.g., Final Term, Mid Term)'],
                ['- Academic Year: Academic year (e.g., 2024-25)'],
                [''],
                ['Notes:'],
                ['- All marks should be numeric values'],
                ['- Student names should not be empty'],
                ['- Roll numbers should be unique'],
                ['- The system supports both CSV and Excel formats']
            ]
            
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Instructions', index=False, header=False)
            
            # Grading scale sheet
            grading_data = [
                ['Percentage', 'Grade', 'Remarks', 'GPA'],
                ['90-100%', 'A+', 'Outstanding', '4.0'],
                ['80-90%', 'A', 'Excellent', '3.6'],
                ['70-80%', 'B+', 'Very Good', '3.2'],
                ['60-70%', 'B', 'Good', '2.8'],
                ['50-60%', 'C+', 'Above Average', '2.4'],
                ['40-50%', 'C', 'Average', '2.0'],
                ['20-40%', 'D', 'Below Average', '1.6'],
                ['1-20%', 'E', 'Insufficient', '0.8']
            ]
            
            grading_df = pd.DataFrame(grading_data[1:], columns=grading_data[0])
            grading_df.to_excel(writer, sheet_name='Grading Scale', index=False)
        
        self.stdout.write(
            self.style.SUCCESS(f'Excel template created successfully: {filename}')
        )
        self.stdout.write(f'File location: {filepath}')
        self.stdout.write('You can now use this template to import results data.') 