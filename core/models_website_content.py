from django.db import models
from django.utils.text import slugify
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

class WebsiteSection(models.Model):
    """Base model for different website sections"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class SchoolInfo(models.Model):
    """Model for school information"""
    name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='school/', blank=True, null=True)
    established_year = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('School Information')
        verbose_name_plural = _('School Information')
    
    def __str__(self):
        return self.name

class WelcomeMessage(WebsiteSection):
    """Model for welcome carousel messages"""
    subtitle = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = _('Welcome Message')
        verbose_name_plural = _('Welcome Messages')
        ordering = ['order']
    
    def __str__(self):
        return self.name

class AboutPage(models.Model):
    """Model for About page content"""
    title = models.CharField(max_length=200, default="Welcome to Nawa Prativa")
    subtitle = models.CharField(max_length=255, default="Nurturing minds, building futures, and creating leaders since 2045 B.S.")
    history_title = models.CharField(max_length=100, default="Our History")
    history_content = models.TextField()
    history_image = models.ImageField(upload_to='about/', blank=True, null=True)
    mission_title = models.CharField(max_length=100, default="Our Mission")
    mission_content = models.TextField()
    mission_icon = models.CharField(max_length=50, default="fas fa-bullseye")
    vision_title = models.CharField(max_length=100, default="Our Vision")
    vision_content = models.TextField()
    vision_icon = models.CharField(max_length=50, default="fas fa-eye")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "About Page"
        verbose_name_plural = "About Page"
    
    def __str__(self):
        return self.title

class CoreValue(models.Model):
    """Model for school's core values"""
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Font Awesome icon class")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title

class Achievement(models.Model):
    """Model for school achievements"""
    title = models.CharField(max_length=100)
    number = models.CharField(max_length=20)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title

class ContactInfo(models.Model):
    """Model for contact information"""
    address = models.TextField()
    phone = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?[0-9]+$', 'Enter a valid phone number.')])
    email = models.EmailField()
    office_hours = models.TextField()
    google_map_embed = models.TextField(blank=True, help_text="Paste Google Maps embed code here")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Contact Information"
        verbose_name_plural = "Contact Information"
    
    def __str__(self):
        return "Contact Information"

class SocialMedia(models.Model):
    """Model for social media links"""
    platform = models.CharField(max_length=50)
    url = models.URLField()
    icon = models.CharField(max_length=50, help_text="Font Awesome icon class")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Social Media"
        verbose_name_plural = "Social Media"
    
    def __str__(self):
        return self.platform

class Facility(models.Model):
    """Model for school facilities"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Font Awesome icon class")
    image = models.ImageField(upload_to='facilities/', blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Facility"
        verbose_name_plural = "Facilities"
    
    def __str__(self):
        return self.name

class Banner(models.Model):
    """Model for homepage banner sliders"""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='banners/')
    button_text = models.CharField(max_length=50, blank=True)
    button_url = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title

# Notice model is defined in models.py