from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Student

class Command(BaseCommand):
    help = 'Bulk-create Django users for all students without a linked user.'

    def handle(self, *args, **options):
        created_count = 0
        for student in Student.objects.filter(user__isnull=True):
            if not student.username:
                self.stdout.write(self.style.WARNING(f'Student {student.id} has no username, skipping.'))
                continue
            if User.objects.filter(username=student.username).exists():
                self.stdout.write(self.style.WARNING(f'User with username {student.username} already exists, skipping.'))
                continue
            user = User.objects.create_user(
                username=student.username,
                password='changeme123',
                first_name=student.full_name.split(' ')[0] if student.full_name else '',
                last_name=' '.join(student.full_name.split(' ')[1:]) if student.full_name and len(student.full_name.split(' ')) > 1 else '',
                email=student.email or ''
            )
            student.user = user
            student.save()
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f'Created user for student {student.full_name} ({student.username})'))
        self.stdout.write(self.style.SUCCESS(f'Finished. Created {created_count} users.')) 