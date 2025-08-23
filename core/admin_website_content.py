from django.contrib import admin
from .models_website_content import AboutPage, CoreValue, Achievement, ContactInfo, SocialMedia, Facility, Banner, WelcomeMessage, SchoolInfo

class CoreValueInline(admin.TabularInline):
    model = CoreValue
    extra = 1

class AchievementInline(admin.TabularInline):
    model = Achievement
    extra = 1

class SocialMediaInline(admin.TabularInline):
    model = SocialMedia
    extra = 1

@admin.register(AboutPage)
class AboutPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'updated_at')
    fieldsets = (
        ('Page Header', {
            'fields': ('title', 'subtitle', 'is_active')
        }),
        ('History Section', {
            'fields': ('history_title', 'history_content', 'history_image')
        }),
        ('Mission & Vision', {
            'fields': ('mission_title', 'mission_content', 'mission_icon', 'vision_title', 'vision_content', 'vision_icon')
        }),
    )

@admin.register(CoreValue)
class CoreValueAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('title', 'description')

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'number', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('title', 'description')

@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'email', 'phone', 'is_active', 'updated_at')
    fieldsets = (
        ('Contact Details', {
            'fields': ('address', 'phone', 'email', 'office_hours', 'is_active')
        }),
        ('Map', {
            'fields': ('google_map_embed',),
            'classes': ('collapse',),
        }),
    )

@admin.register(SocialMedia)
class SocialMediaAdmin(admin.ModelAdmin):
    list_display = ('platform', 'url', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('platform',)

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('name', 'description')

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('title',)

@admin.register(WelcomeMessage)
class WelcomeMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'subtitle', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('name', 'subtitle')

@admin.register(SchoolInfo)
class SchoolInfoAdmin(admin.ModelAdmin):
    list_display = ('name', 'tagline', 'established_year', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('name', 'tagline')
    fieldsets = (
        ('School Details', {
            'fields': ('name', 'tagline', 'established_year', 'is_active')
        }),
        ('Media', {
            'fields': ('logo',),
        }),
    )