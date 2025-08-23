from django.core.management.base import BaseCommand
from core.models import Subject

class Command(BaseCommand):
    help = 'Populate sample subjects for the enhanced result management system'

    def handle(self, *args, **options):
        subjects_data = [
            {
                'name': 'English',
                'credit_hour': 4.0,
                'description': 'English Language and Literature'
            },
            {
                'name': 'Nepali',
                'credit_hour': 4.0,
                'description': 'Nepali Language and Literature'
            },
            {
                'name': 'Mathematics',
                'credit_hour': 5.0,
                'description': 'Mathematics and Problem Solving'
            },
            {
                'name': 'Science',
                'credit_hour': 5.0,
                'description': 'General Science including Physics, Chemistry, and Biology'
            },
            {
                'name': 'Social Studies',
                'credit_hour': 4.0,
                'description': 'Social Studies including History, Geography, and Civics'
            },
            {
                'name': 'Computer Science',
                'credit_hour': 3.0,
                'description': 'Computer Science and Information Technology'
            },
            {
                'name': 'Health and Physical Education',
                'credit_hour': 2.0,
                'description': 'Health Education and Physical Activities'
            },
            {
                'name': 'Optional Mathematics',
                'credit_hour': 4.0,
                'description': 'Advanced Mathematics (Optional Subject)'
            }
        ]

        created_count = 0
        for subject_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                name=subject_data['name'],
                defaults={
                    'credit_hour': subject_data['credit_hour'],
                    'description': subject_data['description']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created subject: {subject.name} ({subject.credit_hour} credits)')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Subject already exists: {subject.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new subjects')
        ) 