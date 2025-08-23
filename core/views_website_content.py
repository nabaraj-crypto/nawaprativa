from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages

from .models import ContactMessage, Notice
from .models_website_content import AboutPage, CoreValue, Achievement, ContactInfo, SocialMedia, Facility, Banner, WelcomeMessage, SchoolInfo
from .serializers_website_content import AboutPageSerializer, CoreValueSerializer, AchievementSerializer, ContactInfoSerializer, SocialMediaSerializer, FacilitySerializer, BannerSerializer, WelcomeMessageSerializer, SchoolInfoSerializer

# API Views for Website Content

class AboutPageAPIView(APIView):
    """
    API view for retrieving about page content
    """
    def get(self, request, format=None):
        about = AboutPage.objects.filter(is_active=True).first()
        if not about:
            return Response({"detail": "About page content not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AboutPageSerializer(about)
        
        # Get related core values
        core_values = CoreValue.objects.filter(is_active=True).order_by('order')
        core_values_serializer = CoreValueSerializer(core_values, many=True)
        
        # Get achievements
        achievements = Achievement.objects.filter(is_active=True).order_by('order')
        achievements_serializer = AchievementSerializer(achievements, many=True)
        
        data = serializer.data
        data['core_values'] = core_values_serializer.data
        data['achievements'] = achievements_serializer.data
        
        return Response(data)

class CoreValueListAPIView(generics.ListAPIView):
    """
    API view for listing core values
    """
    queryset = CoreValue.objects.filter(is_active=True).order_by('order')
    serializer_class = CoreValueSerializer

class AchievementListAPIView(generics.ListAPIView):
    """
    API view for listing achievements
    """
    queryset = Achievement.objects.filter(is_active=True).order_by('order')
    serializer_class = AchievementSerializer

class ContactInfoAPIView(APIView):
    """
    API view for retrieving contact information
    """
    def get(self, request, format=None):
        contact_info = ContactInfo.objects.filter(is_active=True).first()
        if not contact_info:
            return Response({"detail": "Contact information not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ContactInfoSerializer(contact_info)
        
        # Get social media links
        social_media = SocialMedia.objects.filter(is_active=True).order_by('order')
        social_media_serializer = SocialMediaSerializer(social_media, many=True)
        
        data = serializer.data
        data['social_media'] = social_media_serializer.data
        
        return Response(data)

class SocialMediaListAPIView(generics.ListAPIView):
    """
    API view for listing social media links
    """
    queryset = SocialMedia.objects.filter(is_active=True).order_by('order')
    serializer_class = SocialMediaSerializer

class FacilityListAPIView(generics.ListAPIView):
    """
    API view for listing facilities
    """
    queryset = Facility.objects.filter(is_active=True).order_by('order')
    serializer_class = FacilitySerializer

class BannerListAPIView(generics.ListAPIView):
    """
    API view for listing banners
    """
    queryset = Banner.objects.filter(is_active=True).order_by('order')
    serializer_class = BannerSerializer

class WelcomeMessageListAPIView(generics.ListAPIView):
    """
    API view for listing welcome messages
    """
    queryset = WelcomeMessage.objects.filter(is_active=True).order_by('order')
    serializer_class = WelcomeMessageSerializer

class SchoolInfoAPIView(APIView):
    """
    API view for retrieving school information
    """
    def get(self, request, format=None):
        school_info = SchoolInfo.objects.filter(is_active=True).first()
        if not school_info:
            return Response({"detail": "School information not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SchoolInfoSerializer(school_info)
        return Response(serializer.data)

# Template Views for Website Content

def about_page(request):
    """View for the about page"""
    # Get the about page content
    about = AboutPage.objects.filter(is_active=True).first()
    
    # Get core values
    core_values = CoreValue.objects.filter(is_active=True).order_by('order')
    
    # Get achievements
    achievements = Achievement.objects.filter(is_active=True).order_by('order')
    
    context = {
        'about': about,
        'core_values': core_values,
        'achievements': achievements,
    }
    
    return render(request, 'about.html', context)

def contact_page(request):
    """View for the contact page"""
    # Get the contact information
    contact_info = ContactInfo.objects.filter(is_active=True).first()
    
    # Get social media links
    social_media = SocialMedia.objects.filter(is_active=True).order_by('order')
    
    if request.method == 'POST':
        # Process contact form submission
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        
        # Create a new contact message
        ContactMessage.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message
        )
        
        # Redirect to the same page with a success message
        messages.success(request, 'Your message has been sent successfully!')
        return redirect('contact_page')
    
    context = {
        'contact_info': contact_info,
        'social_media': social_media,
    }
    
    return render(request, 'contact.html', context)

def index_page(request):
    """View for the home page"""
    # Get the latest notice
    latest_notice = Notice.objects.filter(is_active=True).order_by('-date').first()
    
    # Get banners for the slider
    banners = Banner.objects.filter(is_active=True).order_by('order')
    
    # Get welcome messages for the carousel
    welcome_messages = WelcomeMessage.objects.filter(is_active=True).order_by('order')
    
    # Get facilities for the side menu
    facilities = Facility.objects.filter(is_active=True).order_by('order')
    
    # Get school information
    school_info = SchoolInfo.objects.filter(is_active=True).first()
    
    context = {
        'latest_notice': latest_notice,
        'banners': banners,
        'welcome_messages': welcome_messages,
        'facilities': facilities,
        'school_info': school_info,
    }
    
    return render(request, 'index.html', context)