import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from .models import User, Post, Profile
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator, PageNotAnInteger,EmptyPage
from django.db.models import Q


def index(request):

    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def posts(request):

    # Composing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    try:
        data = json.loads(request.body)
        content = data.get("content", "")
    except json.JSONDecodeError:
        print("Empty response")

    if content  == "":
        return JsonResponse({
                "error": "Need to write something."
            }, status=400)

    new_post = Post(
            user=request.user,
            content=content
        )
    new_post.save()
    return JsonResponse({"message": "Post sent successfully."}, status=201)

@csrf_exempt
def post(request, post_id):

    # Query for requested post
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    # Return post contents
    if request.method == "GET":
        return JsonResponse(post.serialize())

    # Update
    elif request.method == "PUT":
        data = json.loads(request.body)
        content = data.get("content", "")
        if data.get("like") is not None:
            post.like = data["like"]
        
        post.content = content

        post.save()
        return HttpResponse(status=204)

    # Post must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

@login_required
def follows(request):

    # Composing a new Follow must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    try:
        data = json.loads(request.body)
        follow = data.get("follow", "")
    except json.JSONDecodeError:
        print("Empty response")

    new_follow = Profile(
            user=request.user,
            follow=follow
        )
    new_follow.save()
    return JsonResponse({"message": "Post sent successfully."}, status=201)

@csrf_exempt
@login_required
def follow(request, user_id):

    try:
        user = User.objects.get(pk=user_id)
        profile_user = Profile.objects.get(user=user)
        profile = Profile.objects.get(user=request.user)



    except Profile.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    if request.method == "GET":
        return JsonResponse(profile_user.serialize())
        
    elif request.method == "PUT":

        if not profile.follow.contains(user):
             profile.follow.add(user)
        elif profile.follow.contains(user):
           profile.follow.remove(user)


        profile.save()

        return HttpResponse(status=204)

@csrf_exempt
@login_required
def like_post(request, post_id):
    
    try:
        post = Post.objects.get(pk=post_id)

    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)


    # Update
    if request.method == "PUT":

        if not post.likes.contains(request.user):
            
            post.likes.add(request.user)
            post.like +=  1
        elif post.likes.contains(request.user):
            post.likes.remove(request.user)
            post.like -= 1

        post.save()

        return HttpResponse(status=204)

    # Likes must be via PUT
    else:
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)
    
@login_required   
def paginate(request, page, page_post, user_id=None):
        
    if page == "AllPosts":
        posts = Post.objects.all().order_by('-date')
    elif page == "Perfil":
                
        if user_id is not None:
            user_id = int(user_id)
            
            posts = Post.objects.filter(user_id=user_id).order_by('-date')
                   
    elif page == "Following":
       
        user_profile = Profile.objects.get(user=request.user)
        followed_users = user_profile.follow.all()
        posts = Post.objects.filter(user__in=followed_users).order_by('-date')


    paginator = Paginator(posts, 10)

    try:
        posts_page = paginator.get_page( page_post)
    except PageNotAnInteger:
        posts_page = paginator.get_page(1)
    except EmptyPage:
        posts_page = paginator.get_page(paginator.num_pages)

    serialized_posts = [post.serialize() for post in posts_page]

    pagination_info = {
        'page': {
            "current_page": posts_page.number,
            "total_pages": paginator.num_pages,
            "has_previous": posts_page.has_previous(),
            "has_next": posts_page.has_next()
        },
        "posts": serialized_posts
    }

    return JsonResponse(pagination_info, safe=False)

@login_required
def perfil_view(request, page_post, user_id):
    
    user_id = int(user_id)
    page = 'Perfil'
    
    return paginate(request, page=page, page_post=page_post, user_id=user_id)
