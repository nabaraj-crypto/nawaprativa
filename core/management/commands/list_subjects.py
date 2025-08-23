from django.core.management.base import BaseCommand
from core.models import Subject

class Command(BaseCommand):
    help = 'List all subjects in the database'

    def handle(self, *args, **options):
        subjects = Subject.objects.all().order_by('name')
        
        if subjects.count() == 0:
            self.stdout.write(
                self.style.WARNING('No subjects found in the database.')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {subjects.count()} subjects:')
        )
        self.stdout.write('=' * 60)
        
        for subject in subjects:
            self.stdout.write(
                f'📚 {subject.name:<25} | Code: {subject.code:<8} | Credits: {subject.credit_hour}'
            )
        
        self.stdout.write('=' * 60) 