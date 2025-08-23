from django.core.management.base import BaseCommand
from core.models import Subject
from django.db.models import Count

class Command(BaseCommand):
    help = 'Clean up duplicate subjects in the database'

    def handle(self, *args, **options):
        # Find subjects with duplicate names (case-insensitive)
        subjects = Subject.objects.all()
        seen_names = {}
        duplicates = []
        
        for subject in subjects:
            name_lower = subject.name.lower()
            if name_lower in seen_names:
                duplicates.append((seen_names[name_lower], subject))
            else:
                seen_names[name_lower] = subject
        
        if not duplicates:
            self.stdout.write(
                self.style.SUCCESS('No duplicate subjects found!')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'Found {len(duplicates)} duplicate subject pairs:')
        )
        
        for i, (original, duplicate) in enumerate(duplicates, 1):
            self.stdout.write(f'{i}. "{original.name}" (ID: {original.id}) vs "{duplicate.name}" (ID: {duplicate.id})')
        
        # Ask for confirmation
        response = input('\nDo you want to delete the duplicate subjects? (yes/no): ')
        if response.lower() not in ['yes', 'y']:
            self.stdout.write('Operation cancelled.')
            return
        
        deleted_count = 0
        for original, duplicate in duplicates:
            try:
                # Keep the one with the better name (proper capitalization)
                if original.name == original.name.title() or original.name == original.name.upper():
                    # Original has better capitalization, delete duplicate
                    duplicate.delete()
                    self.stdout.write(f'Deleted duplicate: "{duplicate.name}" (ID: {duplicate.id})')
                else:
                    # Duplicate has better capitalization, delete original
                    original.delete()
                    self.stdout.write(f'Deleted duplicate: "{original.name}" (ID: {original.id})')
                deleted_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error deleting duplicate: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} duplicate subjects.')
        )
        
        # Show remaining subjects
        remaining = Subject.objects.all().order_by('name')
        self.stdout.write(f'\nRemaining subjects ({remaining.count()}):')
        for subject in remaining:
            self.stdout.write(f'📚 {subject.name} (Code: {subject.code}, Credits: {subject.credit_hour})') 