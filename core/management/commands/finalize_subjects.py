from django.core.management.base import BaseCommand
from core.models import Subject

class Command(BaseCommand):
    help = 'Finalize and standardize subject names'

    def handle(self, *args, **options):
        # Standardize subject names
        updates = [
            ('Math', 'Mathematics'),
            ('physics', 'Physics'),
        ]
        
        for old_name, new_name in updates:
            try:
                subject = Subject.objects.get(name=old_name)
                subject.name = new_name
                subject.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated "{old_name}" to "{new_name}"')
                )
            except Subject.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Subject "{old_name}" not found')
                )
            except Subject.MultipleObjectsReturned:
                self.stdout.write(
                    self.style.ERROR(f'Multiple subjects found with name "{old_name}"')
                )
        
        # Show final list
        subjects = Subject.objects.all().order_by('name')
        self.stdout.write(f'\nFinal subjects ({subjects.count()}):')
        for subject in subjects:
            self.stdout.write(f'📚 {subject.name} (Code: {subject.code}, Credits: {subject.credit_hour})') 