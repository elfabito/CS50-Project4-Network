
from django.contrib.auth.models import AbstractUser, User
from django.db import models
from django.db.models.signals import post_save

class User(AbstractUser):
    id = models.AutoField(primary_key=True)
    pass

class Profile(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    follow = models.ManyToManyField(User,
                                    related_name='followed_by',
                                    symmetrical=  False,
                                    blank=True,
                                       )
    def count_following(self):
        return self.follow.count()
    
    def count_followers(self):
        return Profile.objects.filter(follow=self.user).count()
    
    def followers(self):
        profiles = Profile.objects.filter(follow=self.user)
        return profiles
   
    def __str__(self):
        return str(f'{self.user}:Follow:')
    
    def serialize(self):
        return {
            "id": self.id,
            "user_id" : self.user.id,
            "user": self.user.username,
            "follow": [user.username for user in self.follow.all()],
            "id_follow": [user.id for user in self.follow.all()],
            "followers": [profile.user.username for profile in self.followers()],
            "id_followers": [profile.user.id for profile in self.followers()],
            "count_following": self.count_following(),
            "count_followers": self.count_followers(),
        }
 
def follows(sender,instance,created,**kwargs):
    if created:
        user_profile = Profile(user=instance)
        user_profile.save()
        
post_save.connect(follows, sender=User)


class Post(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    like = models.IntegerField(default=0)
    likes = models.ManyToManyField(User, blank=True, related_name="post_likes")

    def __str__(self):
        return self.content
    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user.id,
            "user": self.user.username,
            "content": self.content,
            "date": self.date.strftime("%b %d %Y, %I:%M %p"),
            "like": self.like,
            "likes": [user.username for user in self.likes.all()]
            
        }
    
