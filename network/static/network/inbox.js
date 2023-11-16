document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  const user_id = JSON.parse(document.getElementById("user_id").textContent);
  document
    .querySelector("#following")
    .addEventListener("click", () => load_following());
  document
    .querySelector("#all_posts")
    .addEventListener("click", () => all_posts());
  document
    .querySelector("#perfil")
    .addEventListener("click", () => showProfile(user_id, 1));

  all_posts();
});

function all_posts() {
  // Show the all_posts and hide other views
  document.querySelector("#posts").innerHTML = "";
  document.querySelector("#profile").style.display = "none";
  document.querySelector("#followingDiv").style.display = "none";
  document.querySelector("#posts").style.display = "block";
  document.querySelector("#formDiv").style.display = "block";
  showPost("AllPosts", 1);
}
function load_userprofile() {
  // Show the Profile and hide other views
  document.querySelector("#profile").innerHTML = "";
  document.querySelector("#profile").style.display = "block";
  document.querySelector("#followingDiv").style.display = "none";
  document.querySelector("#posts").style.display = "none";
  document.querySelector("#formDiv").style.display = "none";
}

function load_following() {
  // Show the Following and hide other views
  document.querySelector("#followingDiv").style.display = "block";
  document.querySelector("#posts").style.display = "none";
  document.querySelector("#formDiv").style.display = "none";
  document.querySelector("#profile").style.display = "none";
  document.querySelector("#followingDiv").innerHTML = "";

  showPost("Following", 1);
}

function editPost(id) {
  let edit = document.querySelector(`#btn_edit${id}`);
  let content = document.getElementById(`content${id}`);
  let value = content.getElementsByTagName("p")[0];
  // let value = document.getElementById("p_content");
  let gap = document.createElement("br");
  // let value = content.getElementsByTagName("p")[0].innerHTML;

  value.style.display = "none";
  edit.style.display = "none";

  let input = document.createElement("textarea");
  input.innerText = value.innerHTML;
  input.id = "input";

  var button = document.createElement("button");
  edit.style.display = "none";
  input.maxLength = "200";

  content.append(input);
  content.append(gap);
  content.append(button);
  button.innerHTML = "Save";
  button.addEventListener("click", (e) => {
    e.preventDefault();
    let content_new = input.value;
    console.log(content_new);
    fetch(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        content: `${content_new}`,
      }),
    }).then((result) => {
      content.removeChild(gap);
      content.removeChild(button);
      content.removeChild(input);
      edit.style.display = "block";
      content.style.display = "block";
      input.style.display = "none";
      value.style.display = "block";
      button.style.display = "none";
      refreshPost(id);
    });
  });
}

function refreshPost(id) {
  fetch(`/posts/${id}`)
    .then((response) => response.json())
    .then((post) => {
      let content = document.getElementById(`${id}`);
      let value = content.getElementsByTagName("p")[0];
      value.innerHTML = post.content;
    });
}

function submitForm() {
  var element = document.getElementById("form");
  element.addEventListener("submit", (e) => {
    e.preventDefault();

    let content = document.getElementById("contentForm").value;

    fetch("/posts", {
      method: "POST",
      body: JSON.stringify({
        content: `${content}`,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        location.reload();
        document.querySelector("#contentForm").value = "";
        showPost("AllPosts", 1);
      });
  });
}

async function like(post_id, like, page, currentPage, userid) {
  try {
    const response = await fetch(`/like/${post_id}`, {
      method: "PUT",
      body: JSON.stringify({
        like: like,
      }),
    });

    if (response.ok) {
      const postResponse = await fetch(`/posts/${post_id}`);
      const post = await postResponse.json();

      const elementToUpdate = document.getElementById(`like${post_id}`);
      elementToUpdate.innerHTML = post.like;

      if (page != "Perfil") {
        showPost(page, currentPage);
      } else {
        showProfile(userid, currentPage);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function follow(post) {
  fetch(`follow/${post.user_id}`, {
    method: "PUT",
    body: JSON.stringify({
      follow: post.user,
    }),
  });
}

function showProfile(userid, currentPage) {
  load_userprofile();

  const user_id = JSON.parse(document.getElementById("user_id").textContent);
  fetch(`follow/${userid}`)
    .then((response) => response.json())
    .then((profile_tofollow) => {
      const btn_follow = document.createElement("a");
      btn_follow.id = `follow_btn${profile_tofollow.user_id}`;
      const data2 = document.querySelector(".Perfil");
      const div = document.createElement("div");
      div.className = "content";

      const element0 = document.createElement("div");
      element0.innerHTML = `Profile : ${profile_tofollow.user}`;
      element0.className = "content";

      data2.append(element0);
      if (user_id != userid) {
        div.append(btn_follow);
        data2.append(div);
      }

      fetchAndAppendPosts(
        (page = "Perfil"),
        (currentPage = currentPage),
        (id = userid)
      );

      // DIV FOLLOWING HEAD
      const element1 = document.createElement("div");
      element1.className = "content";
      element1.id = "following";
      element1.innerHTML = `
                <div>
                <h4>Following ${profile_tofollow.count_following}</h4></div>`;
      const space = document.createElement("br");

      fetch(`/follow/${user_id}`)
        .then((response) => response.json())
        .then((profile_logged) => {
          if (user_id != userid) {
            if (profile_logged.follow.includes(profile_tofollow.user)) {
              document.querySelector(
                `#follow_btn${profile_tofollow.user_id}`
              ).innerHTML = "unFollow";
            } else {
              document.querySelector(
                `#follow_btn${profile_tofollow.user_id}`
              ).innerHTML = "Follow";
            }

            btn_follow.addEventListener("click", (e) => {
              e.preventDefault();

              fetch(`follow/${profile_tofollow.user_id}`, {
                method: "PUT",
                body: JSON.stringify({
                  follow: profile_logged.user,
                }),
              }).then((response) => {
                if (response.ok) {
                  load_userprofile();
                  showProfile(profile_tofollow.user_id, currentPage);
                }
              });
            });
          }
        });

      // DIV FOLLOWERS HEAD
      const element2 = document.createElement("div");
      element2.className = "content";
      element2.id = "followers";
      element2.innerHTML = `
                <div>
                <h4>Followers ${profile_tofollow.count_followers}</h4>`;

      // DIV FOLLOWING CONTENT
      for (let i = profile_tofollow.follow.length - 1; i >= 0; i--) {
        const following_data = document.createElement("div");
        following_data.innerHTML = `
                <div>
              
                <ul>
                <li>
                <a id="" onclick="showProfile(${profile_tofollow.id_follow[i]}, ${currentPage})" >${profile_tofollow.follow[i]}</a>
                </li>
                </ul>
                </div>`;
        element1.append(following_data);
      }
      // DIV FOLLOWERS CONTENT
      for (let i = profile_tofollow.followers.length - 1; i >= 0; i--) {
        const followed_data = document.createElement("div");
        followed_data.innerHTML = `
                <div>
              
                <ul>
                <li>
                <a onclick="showProfile(${profile_tofollow.id_followers[i]},${currentPage})">${profile_tofollow.followers[i]}</a>
                </li>
                </ul>
                </div>`;

        element2.append(followed_data);
      }
      data2.append(element1);
      data2.append(element2);
    });
}

function showPost(page, current_page) {
  document.querySelector(`.${page}`).innerHTML = "";
  if (page == "Following") {
    const element0 = document.createElement("div");
    element0.innerHTML = `Following : Posts`;
    element0.className = "content";
    document.querySelector(".Following").append(element0);
  }
  fetchAndAppendPosts(page, current_page);
}

function fetchAndAppendPosts(page, currentPage, id = null) {
  if (id != null) {
    fetch(`paginate/Perfil/${currentPage}/${id}`)
      .then((response) => response.json())
      .then((data) => {
        const pagination_info = data.page;
        const posts = data.posts;

        appendPostsToDOM(posts, page, currentPage);
        // Update the current page
        currentPage = pagination_info.current_page;

        // Construct pagination links
        const paginationContainer = document.createElement("div");
        paginationContainer.className = "content";
        let previous = currentPage - 1;
        let next = currentPage + 1;
        if (pagination_info.has_previous) {
          paginationContainer.innerHTML += `<a onclick=showProfile(${id},${previous})>Prev.</a>`;
        }

        paginationContainer.innerHTML += ` Page ${pagination_info.current_page} of ${pagination_info.total_pages}. `;

        if (pagination_info.has_next) {
          paginationContainer.innerHTML += `<a onclick=showProfile(${id},${next})>Next</a>`;
        }

        // Append the pagination links
        const dataContainer = document.querySelector(`.${page}`);

        dataContainer.appendChild(paginationContainer);
      });
  } else {
    fetch(`/paginate/${page}/${currentPage}`)
      .then((response) => response.json())
      .then((data) => {
        const pagination_info = data.page;
        const posts = data.posts;

        appendPostsToDOM(posts, page, currentPage);

        // Update the current page
        currentPage = pagination_info.current_page;
        // Construct pagination links
        const paginationContainer = document.createElement("div");
        paginationContainer.className = "content";
        let previous = currentPage - 1;
        let next = currentPage + 1;
        if (pagination_info.has_previous) {
          paginationContainer.innerHTML += `<a onclick=showPost('${page}',${previous})>Prev.</a>`;
        }

        paginationContainer.innerHTML += ` Page ${pagination_info.current_page} of ${pagination_info.total_pages}. `;

        if (pagination_info.has_next) {
          paginationContainer.innerHTML += `<a onclick=showPost('${page}',${next})>Next</a>`;
        }

        // Append the pagination links
        const dataContainer = document.querySelector(`.${page}`);

        dataContainer.appendChild(paginationContainer);
      });
  }
}

function appendPostsToDOM(posts, page, currentPage) {
  const dataContainer = document.querySelector(`.${page}`);
  const user_id = JSON.parse(document.getElementById("user_id").textContent);

  for (let i = 0; i < posts.length; i++) {
    const user_id = JSON.parse(document.getElementById("user_id").textContent);
    const element = document.createElement("div");
    element.className = "content";
    element.id = posts[i].id;

    element.innerHTML += `<h4><a onclick="showProfile(${posts[i].user_id},1)">${posts[i].user}</a></h4>`;
    if (posts[i].user_id == user_id) {
      element.innerHTML += `<a id='btn_edit${posts[i].id}' onclick='editPost(${posts[i].id});'>Edit</a>
      <br>
      `;
    }

    element.innerHTML += `<div id="content${posts[i].id}">
      
      <p id="p_content" class="p_cont">${posts[i].content}</p>
      </div>

      
      <p id="date">${posts[i].date}</p>
      <span><a onclick="like(${posts[i].id},${posts[i].like}, '${page}', ${currentPage}, ${posts[i].user_id});" >❤️</a><span id="like${posts[i].id}">${posts[i].like}</span></span>
      <span>Likes</span></br>  `;

    dataContainer.appendChild(element);
  }
}
