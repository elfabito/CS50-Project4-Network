
from django.urls import path
# from .views import PostsView
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
       
        # API Routes
    path("posts", views.posts, name="posts"),
    path("posts/<int:post_id>", views.post, name="post"),
  
    path("paginate/<str:page>/<int:page_post>", views.paginate, name="paginate"),
    path("paginate/Perfil/<int:page_post>/<int:user_id>/", views.perfil_view, name="perfil_view"),

    path("like/<int:post_id>", views.like_post, name="like"),  
       
    path("follow", views.follows, name="follows"),
    path("follow/<int:user_id>", views.follow, name="follow"),

   
    
    
]
