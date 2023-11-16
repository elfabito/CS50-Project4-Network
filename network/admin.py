from django.contrib import admin
from .models import Profile, User, Post

from django.contrib.auth.admin import UserAdmin as AuthUserAdmin

class UserProfileInline(admin.StackedInline):
 model = Profile
 max_num = 1
 fields = ["user", "follow"]
 can_delete = False

class UserAdmin(AuthUserAdmin):
 model = User
 inlines = [UserProfileInline]

admin.site.register(User, UserAdmin)
admin.site.register(Post)
admin.site.register(Profile)

