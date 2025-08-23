from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Student

class Command(BaseCommand):
    help = 'Delete all unlinked Students and Users, then recreate and link users for all students.'

    def handle(self, *args, **options):
        # Delete all Users not linked to a Student
        student_user_ids = set(Student.objects.exclude(user=None).values_list('user_id', flat=True))
        users_to_delete = User.objects.exclude(id__in=student_user_ids).exclude(is_superuser=True)
        deleted_users = users_to_delete.count()
        users_to_delete.delete()

        # Delete all Students not linked to a User or without a username
        students_to_delete = Student.objects.filter(user=None) | Student.objects.filter(username=None)
        deleted_students = students_to_delete.count()
        students_to_delete.delete()

        # Recreate and link users for all students
        created_count = 0
        for student in Student.objects.filter(user=None):
            if not student.username:
                self.stdout.write(self.style.WARNING(f'Student {student.id} has no username, skipping.'))
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
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_users} users and {deleted_students} students. Created {created_count} users for students.')) 