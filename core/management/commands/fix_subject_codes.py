from django.core.management.base import BaseCommand
from core.models import Subject

class Command(BaseCommand):
    help = 'Fix existing subject codes to ensure uniqueness'

    def handle(self, *args, **options):
        subjects = Subject.objects.all()
        updated_count = 0
        
        for subject in subjects:
            # Generate a unique code
            base_code = subject.name.upper()[:3]
            counter = 0
            new_code = base_code
            
            while True:
                # Check if this code already exists (excluding current instance)
                if not Subject.objects.filter(code=new_code).exclude(id=subject.id).exists():
                    break
                counter += 1
                new_code = f"{base_code}{counter}"
            
            # Update the subject code if it's different
            if subject.code != new_code:
                old_code = subject.code
                subject.code = new_code
                subject.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Updated subject "{subject.name}": {old_code} → {new_code}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Subject "{subject.name}" already has correct code: {subject.code}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} subject codes')
        ) 