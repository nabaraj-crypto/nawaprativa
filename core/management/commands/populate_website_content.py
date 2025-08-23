from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from core.models_website_content import SchoolInfo, WelcomeMessage, Facility, Banner
from django.utils.text import slugify
import os

class Command(BaseCommand):
    help = 'Populates sample data for website content models'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample website content...')
        
        # Create SchoolInfo
        school_info, created = SchoolInfo.objects.get_or_create(
            name="Shree Nawa Prativa Secondary School",
            defaults={
                'tagline': "Inspiring Young Minds Since 2060 B.S.",
                'established_year': "2060 B.S.",
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created SchoolInfo: {school_info.name}'))
        else:
            self.stdout.write(f'SchoolInfo already exists: {school_info.name}')
        
        # Create WelcomeMessages
        welcome_messages = [
            {
                'name': "Welcome to Shree Nawa Prativa Secondary School!",
                'subtitle': "Nurturing Minds, Building Futures",
                'order': 1
            },
            {
                'name': "Quality Education, Bright Future!",
                'subtitle': "Empowering Students for Tomorrow's Challenges",
                'order': 2
            },
            {
                'name': "Discipline • Dedication • Excellence",
                'subtitle': "Our Core Values for Success",
                'order': 3
            },
            {
                'name': "Join Our Learning Community",
                'subtitle': "Where Every Student's Potential is Realized",
                'order': 4
            }
        ]
        
        for message_data in welcome_messages:
            message, created = WelcomeMessage.objects.get_or_create(
                name=message_data['name'],
                defaults={
                    'subtitle': message_data['subtitle'],
                    'order': message_data['order'],
                    'slug': slugify(message_data['name']),
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created WelcomeMessage: {message.name}'))
            else:
                self.stdout.write(f'WelcomeMessage already exists: {message.name}')
        
        # Create Facilities
        facilities = [
            {
                'name': "Computer Lab",
                'description': "Modern computer lab with high-speed internet",
                'icon': "fas fa-laptop"
            },
            {
                'name': "Science Lab",
                'description': "Well-equipped science laboratory for practical learning",
                'icon': "fas fa-flask"
            },
            {
                'name': "Library",
                'description': "Extensive collection of books and digital resources",
                'icon': "fas fa-book"
            },
            {
                'name': "Sports Facilities",
                'description': "Indoor and outdoor sports facilities for physical development",
                'icon': "fas fa-futbol"
            },
            {
                'name': "Cafeteria",
                'description': "Hygienic cafeteria serving nutritious meals",
                'icon': "fas fa-utensils"
            },
            {
                'name': "Transportation",
                'description': "Safe and reliable transportation services",
                'icon': "fas fa-bus"
            }
        ]
        
        for facility_data in facilities:
            facility, created = Facility.objects.get_or_create(
                name=facility_data['name'],
                defaults={
                    'description': facility_data['description'],
                    'icon': facility_data['icon'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Facility: {facility.name}'))
            else:
                self.stdout.write(f'Facility already exists: {facility.name}')
        
        self.stdout.write(self.style.SUCCESS('Successfully populated website content'))