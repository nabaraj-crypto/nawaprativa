from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Student
from datetime import date
import random


FIRST_NAMES = [
    'Aarav', 'Sita', 'Hari', 'Gita', 'Bikash', 'Anita', 'Rajesh', 'Puja', 'Suresh', 'Laxmi',
    'Nabin', 'Kiran', 'Manish', 'Sunita', 'Rita', 'Krishna', 'Deepak', 'Ramesh', 'Santosh', 'Bimala'
]
LAST_NAMES = [
    'Shrestha', 'Tamang', 'Gurung', 'Rai', 'Thapa', 'Sharma', 'Yadav', 'Karki', 'Magar', 'Limbu'
]


class Command(BaseCommand):
    help = 'Populate 1000 dummy students across classes 1 to 10, with users.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=1000, help='Number of students to create')

    def handle(self, *args, **options):
        total = options['count']
        created = 0
        classes = [str(c) for c in range(1, 11)]

        for i in range(total):
            try:
                full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                class_name = random.choice(classes)

                # Symbol number: ensure uniqueness; Student.save() will also auto-generate if missing
                symbol_number = None

                # Username/email
                base_username = f"student_{i+1:04d}_{class_name}"
                username = base_username
                # Ensure unique username
                suffix = 1
                while User.objects.filter(username=username).exists() or Student.objects.filter(username=username).exists():
                    username = f"{base_username}_{suffix}"
                    suffix += 1

                email = f"{username}@example.com"

                # Create associated auth user for login
                user = User.objects.create_user(username=username, email=email, password='password123')

                # Random DOBs in 2068-2075 BS approx mapped loosely to AD years
                year = random.randint(2005, 2015)
                month = random.randint(1, 12)
                day = random.randint(1, 28)

                student = Student.objects.create(
                    user=user,
                    username=username,
                    full_name=full_name,
                    date_of_birth=date(year, month, day),
                    gender=random.choice(['Male', 'Female', 'Other']),
                    student_class=class_name,
                    symbol_number=symbol_number or '',
                    email=email,
                    phone_number=f"98{random.randint(10000000, 99999999)}"[:10],
                    address='Bhakundebeshi, Kavre',
                    parent_name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    parent_contact=f"98{random.randint(10000000, 99999999)}"[:10],
                )

                created += 1
                if created % 50 == 0:
                    self.stdout.write(self.style.SUCCESS(f"Created {created}/{total} students..."))

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Skip one due to error: {e}"))
                continue

        self.stdout.write(self.style.SUCCESS(f"Done. Created approximately {created} students."))


