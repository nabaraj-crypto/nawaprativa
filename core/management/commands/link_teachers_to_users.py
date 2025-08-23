from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Teacher, Profile

class Command(BaseCommand):
    help = 'Create and link Django User and Profile objects for all Teacher records.'

    def handle(self, *args, **options):
        created_users = 0
        linked_profiles = 0
        for teacher in Teacher.objects.all():
            # Ensure teacher has a profile
            if not teacher.profile:
                # Create or get user
                user, user_created = User.objects.get_or_create(
                    username=teacher.username,
                    defaults={
                        'first_name': teacher.full_name.split(' ')[0] if teacher.full_name else '',
                        'last_name': ' '.join(teacher.full_name.split(' ')[1:]) if teacher.full_name and len(teacher.full_name.split(' ')) > 1 else '',
                        'email': '',
                    }
                )
                if user_created:
                    user.set_password('changeme123')
                    user.save()
                    created_users += 1
                # Create profile
                profile, _ = Profile.objects.get_or_create(user=user, defaults={'role': 'teacher'})
                teacher.profile = profile
                teacher.user = user
                teacher.plain_password = 'changeme123'
                teacher.save()
                linked_profiles += 1
                self.stdout.write(self.style.SUCCESS(f'Linked Teacher {teacher.full_name} to user {user.username}'))
            else:
                # Ensure user exists and has password
                user = teacher.profile.user
                if not user.has_usable_password():
                    user.set_password('changeme123')
                    user.save()
                    teacher.plain_password = 'changeme123'
                    teacher.save()
                # Ensure teacher.user is set
                if not teacher.user:
                    teacher.user = user
                    teacher.save()
        self.stdout.write(self.style.SUCCESS(f'Created {created_users} users and linked {linked_profiles} teacher profiles.'))
        self.stdout.write(self.style.WARNING('Default password is "changeme123". Please instruct teachers to change their password after first login.')) 