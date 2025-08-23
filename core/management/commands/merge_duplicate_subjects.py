from django.core.management.base import BaseCommand
from core.models import Subject

class Command(BaseCommand):
    help = 'Merge duplicate subjects properly'

    def handle(self, *args, **options):
        # Handle Math vs Mathematics
        try:
            math_subject = Subject.objects.get(name='Math')
            mathematics_subject = Subject.objects.get(name='Mathematics')
            
            self.stdout.write(f'Found both "Math" (ID: {math_subject.id}) and "Mathematics" (ID: {mathematics_subject.id})')
            
            # Keep Mathematics, delete Math
            math_subject.delete()
            self.stdout.write(
                self.style.SUCCESS('Deleted "Math", keeping "Mathematics"')
            )
        except Subject.DoesNotExist:
            self.stdout.write('No Math/Mathematics duplicates found')
        except Subject.MultipleObjectsReturned:
            self.stdout.write(
                self.style.ERROR('Multiple Math or Mathematics subjects found')
            )
        
        # Handle physics vs Physics
        try:
            physics_lower = Subject.objects.get(name='physics')
            physics_lower.name = 'Physics'
            physics_lower.save()
            self.stdout.write(
                self.style.SUCCESS('Updated "physics" to "Physics"')
            )
        except Subject.DoesNotExist:
            self.stdout.write('No "physics" subject found')
        except Subject.MultipleObjectsReturned:
            self.stdout.write(
                self.style.ERROR('Multiple physics subjects found')
            )
        
        # Show final list
        subjects = Subject.objects.all().order_by('name')
        self.stdout.write(f'\nFinal subjects ({subjects.count()}):')
        for subject in subjects:
            self.stdout.write(f'📚 {subject.name} (Code: {subject.code}, Credits: {subject.credit_hour})') 