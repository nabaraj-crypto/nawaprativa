from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Gallery

class Command(BaseCommand):
    help = 'Set the uploader for all existing Gallery images to the first superuser (admin) if not already set.'

    def handle(self, *args, **options):
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR('No superuser found. Please create an admin user first.'))
            return
        updated = 0
        for gallery in Gallery.objects.filter(uploader__isnull=True):
            gallery.uploader = admin
            gallery.save()
            updated += 1
        self.stdout.write(self.style.SUCCESS(f'Set uploader for {updated} gallery images to admin: {admin.username}')) 