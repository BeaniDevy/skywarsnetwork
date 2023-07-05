import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase objects
const auth = firebase.auth();
const db = firebase.firestore();


// Document objects
const fullLoadingScreen = document.querySelector(".pre-loader");
const contentLoadingScreen = document.querySelector(".cont-loader");
const main = document.querySelector("main");
const alert = document.querySelector(".alert");







const pages = {}

pages['/'] = function() {
  main.innerHTML = `
  <div class="welcome">Welcome to SkyWars Network, @<span class='username'></span>!</div>
  <div class='container'>
    <h1 class="section-title">Random Fact</h1>
    <div class='fact'></div>
  </div>
  <div class='container'>
    <h1 class="section-title">Recent News</h1>
    <div class="tile-list"></div>
  </div>
  `;

  const user = auth.currentUser;
  const username = document.querySelector(".username");

  if(!user) {
    username.textContent = `guest`;
  }
  else {
    db.collection("users").doc(`${user.uid}`).get()
    .then((doc) => {
      if(doc.exists){
        if('name' in doc.data()) {
          username.textContent = `${doc.data()['name']}`;
        }
        else {
          Errors('userdata', [`${user.uid}`]);
        };
      }
      else {
        Errors('userdata', [`${user.uid}`]);
      };
    })
    .catch((error) => {
      Errors('userdata', [`${user.uid}`]);
    });
  };

  setTimeout(() => {
    let facts = [];

    db.collection("facts").get()
    .then((snap) => {
      snap.forEach((doc) => {
        facts.push(doc.id);
      });
    })
    .then(() => {
      const fact = facts[Math.floor(Math.random() * facts.length)];

      db.collection("facts").doc(`${fact}`).get()
      .then((doc) => {
        main.querySelector(".fact").innerHTML = `
        <h2>Fact ${fact}</h2>
        <p>${doc.data()['fact']}</p>
        `;
      });
    });
  }, 100);

  setTimeout(() => {
    let newslist = [];

    db.collection("news").get()
    .then((snap) => {
      snap.forEach((doc) => {
        newslist.push(doc.id);
      });
    })
    .then(() => {
      newslist.sort(function(a,b){return a-b});
      newslist.reverse();
      newslist = newslist.slice(0, 4);
      for(let x in newslist){
        db.collection("news").doc(`${newslist[x]}`).get()
        .then((doc) => {
          main.querySelector(".tile-list").innerHTML = `
          ${main.querySelector(".tile-list").innerHTML}
          <div class="tile">
            <a href='/post/${doc.id}'>
              <h1>${doc.data()['Header']}</h1>
              <p>${doc.data()['Content'].substring(0, 50)}...</p>
              <h3>${doc.data()['Date']}</h3>
            </a>
          </div>
          `;
        })
        .catch((error) => {
          Errors(error, {});return;
        });
      };
    })
    .then(() => {
      function addLinks() {
        for(let x in newslist){
          const node = main.querySelectorAll(".tile")[x]
          if(!node){
            setTimeout(() => {
              addLinks();
            }, 100);
            return;
          };

          node.querySelector("a").addEventListener('click', (e) => {
            e.preventDefault();
            UpdatePage('/post', `/${node.querySelector("a").getAttribute("href").split("/")[2]}`);
          });
        };
      };

      setTimeout(addLinks(), 100);
    })
    .then(() => {
      Loading(newslist.length, ".tile");
    });
  }, 100);
};

pages['/news'] = function() {
  main.innerHTML = `
  <h1 class="section-title">All News</h1>
  <div class="tile-list"></div>`;

  const newslist = [];

  db.collection("news").get()
  .then((snap) => {
    snap.forEach((doc) => {
      newslist.push(doc.id);
    });
  })
  .then(() => {
    newslist.sort(function(a,b){return a-b});
    newslist.reverse();
    for(let x in newslist){
      db.collection("news").doc(`${newslist[x]}`).get()
      .then((doc) => {
        main.querySelector(".tile-list").innerHTML = `
        ${main.querySelector(".tile-list").innerHTML}
        <div class="tile">
          <a href='/news/${doc.id}'>
            <h1>${doc.data()['Header']}</h1>
            <p>${doc.data()['Content'].substring(0, 50)}...</p>
            <h3>${doc.data()['Date']}</h3>
          </a>
        </div>
        `;
      })
      .catch((error) => {
        Errors(error, {});return;
      });
    };
  })
  .then(() => {
    function addLinks() {
      for(let x in newslist){
        const node = main.querySelectorAll(".tile")[x]
        if(!node){
          setTimeout(() => {
            addLinks();
          }, 100);
          return;
        };

        node.querySelector("a").addEventListener('click', (e) => {
          e.preventDefault();
          UpdatePage('/post', `/${node.querySelector("a").getAttribute("href").split("/")[2]}`);
        });
      };
    };

    setTimeout(addLinks(), 100);
  })
  .then(() => {
    Loading(newslist.length, ".tile");
  });
};

pages['/post'] = function(id) {
  main.innerHTML = `
  <div class='post'>
    <h1></h1>
    <h3></h3>
    <p></p>
  </div>
  `;

  db.collection("news").doc(`${id.split("/")[1]}`).get()
  .then((doc) => {
    if(!doc.exists){
      UpdatePage('/404');
      return;
    };
    const post = main.querySelector(".post");
    post.querySelector("h1").textContent = `${doc.data()['Header']}`;
    post.querySelector("h3").textContent = `${doc.data()['Date']}`;
    post.querySelector("p").innerHTML = `${doc.data()['Content']}`;
  })
  .catch((error) => {
    alert.textContent = `Error when getting post: ${error}`;
    alert.classList.add("red active");return;
  })
  .then(() => {
    Loading(0, 0);
  })
}

pages['/forums'] = function() {window.location.href = 'https://forums.skywarsnetwork.com';};

pages['/staff'] = function() {
  main.innerHTML = `
  <div class="container">
    <h1 class="section-title">Management</h1>
    <div class="tile-list staff management"></div>
  </div>
  <div class="container">
    <h1 class="section-title">Development</h1>
    <div class="tile-list staff development"></div>
  </div>
  <div class="container">
    <h1 class="section-title">Moderation</h1>
    <div class="tile-list staff moderation"></div>
  </div>
  `;


  let order = [];
  let count = 0;


  db.collection("staff").doc("management").get()
  .then((doc) => {
    if(!doc.exists){
      UpdatePage('/404');
      return;
    };

    order = doc.data()['order'];
    count = count + order.length;
    
    for(let x in order){
      const mng = main.querySelector(".management");
      mng.innerHTML = `
      ${mng.innerHTML}
      <div class="tile">
        <img src='${doc.data()[order[x]]['avatar']}' alt="${order[x]}'s avatar" title="${order[x]}'s avatar" />
        <div class="t">
          <h1>${order[x]}</h1>
          <p>${doc.data()[order[x]]['about']}</p>
        </div>
      </div>
      `;
    }
  })
  .catch((error) => {
    alert.textContent = `Error when getting data: ${error}`;
    alert.classList.add("red active");return;
  })


  db.collection("staff").doc("development").get()
  .then((doc) => {
    if(!doc.exists){
      UpdatePage('/404');
      return;
    };

    order = doc.data()['order'];
    count = count + order.length;
    
    for(let x in order){
      const mng = main.querySelector(".development");
      mng.innerHTML = `
      ${mng.innerHTML}
      <div class="tile">
        <img src='${doc.data()[order[x]]['avatar']}' alt="${order[x]}'s avatar" title="${order[x]}'s avatar" />
        <div class="t">
          <h1>${order[x]}</h1>
          <p>${doc.data()[order[x]]['about']}</p>
        </div>
      </div>
      `;
    }
  })
  .catch((error) => {
    alert.textContent = `Error when getting data: ${error}`;
    alert.classList.add("red active");return;
  })


  db.collection("staff").doc("moderation").get()
  .then((doc) => {
    if(!doc.exists){
      UpdatePage('/404');
      return;
    };

    order = doc.data()['order'];
    count = count + order.length;
    
    for(let x in order){
      const mng = main.querySelector(".moderation");
      mng.innerHTML = `
      ${mng.innerHTML}
      <div class="tile">
        <img src='${doc.data()[order[x]]['avatar']}' alt="${order[x]}'s avatar" title="${order[x]}'s avatar" />
        <div class="t">
          <h1>${order[x]}</h1>
          <p>${doc.data()[order[x]]['about']}</p>
        </div>
      </div>
      `;
    }
  })
  .catch((error) => {
    alert.textContent = `Error when getting data: ${error}`;
    alert.classList.add("red active");return;
  })

  .then(() => {
    Loading(count, ".tile");
  });
};

pages['/accounts'] = function(page) {
  console.log("processing accounts")
  const user = auth.currentUser;
  if(!page || !`/accounts${page}` in pages || (!user && page != '/settings')) {
    UpdatePage('/404')
  }
  else {
    UpdatePage(`/accounts${page}`);
  };
};

pages['/accounts/settings'] = function() {
  const e = [];
  main.innerHTML = `
  <div class="welcome">@<span class="username"></span>'s settings</div>
  <div class="settings container">
    <div class="setting">
      <div class="text">
        <h1>Theme</h1>
        <p>${window.localStorage.getItem("swnthemev1")}</p>
      </div>
      <div class="edit">
        <a endpoint="theme">Edit</a>
      </div>
    </div>
  </div>`;

  e.push(main.querySelector("a[endpoint='theme']"));

  const user = auth.currentUser;
  if(!user) {
    main.querySelector(".username").textContent = 'guest';
  };

  function addLinks() {
    for(let x in e){
      const node = main.querySelectorAll(".setting")[x]
      if(!node){
        setTimeout(() => {
          addLinks();
        }, 100);
        return;
      };

      node.querySelector("a").addEventListener('click', (e) => {
        e.preventDefault();
        if(node.querySelector("a").getAttribute("endpoint") == 'theme'){
          document.body.classList.toggle("dark");
          document.body.classList.toggle("light");
          window.localStorage.setItem("swnthemev1", document.body.classList[0]);
          node.querySelector(".text p").textContent = `${document.body.classList[0]}`;
          return;
        }
        UpdatePage('/accounts', `/settings/${node.querySelector("a").getAttribute("endpoint")}`);
      });
      Loading(0,0);
    };
  };

  if(user) {
    db.collection("users").doc(`${user.uid}`).get()
    .then((doc) => {
      main.querySelector(".username").textContent = `${doc.data()['name']}`;
      main.querySelector(".settings.container").innerHTML = `
      ${main.querySelector(".settings.container").innerHTML}
      <div class="setting">
        <div class="text">
          <h1>Username</h1>
          <p>${doc.data()['name']}</p>
        </div>
        <div class="edit">
          <a endpoint="name">Edit</a>
        </div>
      </div>
      <div class="setting">
        <div class="text">
          <h1>Email</h1>
          <p>${user.email}</p>
        </div>
        <div class="edit">
          <a endpoint="email">Edit</a>
        </div>
      </div>
      <div class="setting">
        <div class="text">
          <h1>Password</h1>
          <p>••••••••</p>
        </div>
        <div class="edit">
          <a endpoint="password">Edit</a>
        </div>
      </div>
      `;
      e.push(main.querySelector("a[endpoint='name']"));
      e.push(main.querySelector("a[endpoint='email']"));
      e.push(main.querySelector("a[endpoint='password']"));

      setTimeout(addLinks(), 100);
    });
  }
  else {
    setTimeout(addLinks(), 100);
  };
};

pages['/accounts/settings/name'] = function() {
  main.innerHTML = `
  <form class='login container'>
    <p class='form-alert'></p>
    <input type="text" placeholder="New Username">
    <input type="password" placeholder="Password">
    <input type="submit" value="Update">
  </form>
  `

  //
};

pages['/accounts/login'] = function() {
  if(auth.currentUser){UpdatePage("/");return;};

  main.innerHTML = `
  <form class='login container'>
    <p class='form-alert'></p>
    <input type="text" placeholder="Username" style="display: none">
    <input type="email" placeholder="Email">
    <input type="password" placeholder="Password">
    <input type="submit" value="Login">
    <input type="button" value="Create Account">
  </form>
  `;

  const form = main.querySelector("form");

  function isblank(str){return str === null || str.match(/^ *$/) !== null;};
  function isvalid(str){return /^(?=.{4})[a-z][a-z\data]*_?[a-z\d]+$/i.test(str);};

  form.querySelector("input[type='button']").addEventListener('click', (e) => {
    e.preventDefault();

    if(form.querySelector("input[type='text']").style.display == 'none') {
      form.querySelector("input[type='text']").style.display = 'block';
      return;
    }

    const formalert = document.querySelector(".form-alert")
    const username = form.querySelector("input[type='text']").value.toLowerCase();

    contentLoadingScreen.style.display = 'flex';
    main.style.display = 'none';

    if((username.length < 4) || (username.length > 20)) {
      formalert.textContent = 'Username must be between 4 and 20 characters';
      formalert.classList.add("active");
      Loading(0,0);
      return;
    }
    if(!isvalid(username)) {
      formalert.textContent = 'Username can only contain a-z, 0-9 and 1 underscore';
      formalert.classList.add("active");
      Loading(0,0);
      return;
    }

    let match = false;

    db.collection("usernames").get()
    .then((snap) => {
      snap.forEach((doc) => {
        if(doc.id == username){
          match = true;
        };
      });
    })

    .then(() => {
      if(match) {
        formalert.textContent = 'That username is already in use';
        formalert.classList.add("active");
        Loading(0,0);
        return;
      }
      else {
        auth.createUserWithEmailAndPassword(`${form.querySelector("input[type='email']").value}`, `${form.querySelector("input[type='password']").value}`)
        .then((userc) => {
          if(userc.user) {
            db.collection("users").doc(`${userc.user.uid}`).set({'name': `${username}`})
            .then(() => {
              db.collection("usernames").doc(`${username}`).set({'by': `${userc.user.uid}`})
              .then(() => {
                UpdatePage('/');
              })
            })
            return;
          }
          else {
            formalert.textContent = 'Unknown error occurred when attempting to sign in';
            formalert.classList.add("active");
            Loading(0,0);
            return;
          };
        })
        .catch((error) => {
          if(error.code == "auth/email-already-in-use") {
            formalert.textContent = 'That email is already in use';
          }
          else if(error.code == "auth/weak-password") {
            formalert.textContent = 'Password needs to be at least 6 characters long';
          }
          else {formalert.textContent = `${error.code}`;console.error(error);};
          formalert.classList.add("active");
          Loading(0,0);
          return;
        });
      };
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if(form.querySelector("input[type='text']").style.display != 'none') {
      form.querySelector("input[type='text']").style.display = 'none';
    }

    const formalert = document.querySelector(".form-alert")

    contentLoadingScreen.style.display = 'flex';
    main.style.display = 'none';

    auth.signInWithEmailAndPassword(`${form.querySelector("input[type='email']").value}`, `${form.querySelector("input[type='password']").value}`)
    .then((userc) => {
      if(userc.user){
        UpdatePage('/');
        return;
      }
      else {
        formalert.textContent = 'Unknown error occurred when attempting to sign in';
        formalert.classList.add("active");
        Loading(0,0);
        return;
      };
    })
    .catch((error) => {
      if(error.code == "auth/user-not-found" || error.code == "auth/wrong-password") {
        formalert.textContent = 'Incorrect email or password';
      }
      else {formalert.textContent = `${error.code}`;console.error(error);};
      formalert.classList.add("active");
      Loading(0,0);
      return;
    });
  });

  Loading(0,0);
};

pages['/404'] = function() {
  main.innerHTML = `
  <div class="content container middle">
    <h1>404</h1>
    <p>The page you requested is not valid.</p>
  </div>
  `;

  main.style.display = 'block';
  contentLoadingScreen.style.display = 'none';
};

function Loading(count, checker) {
  if((checker != checker) && count != main.querySelectorAll(`${checker}`).length) {
    setTimeout(() => {
      Loading(count, checker);
    }, 100);
    return;
  };

  main.style.display = 'block';
  contentLoadingScreen.style.display = 'none';
};

function Errors(err, args) {
  if(err == 'userdata') {
    alert.textContent = `Crucial user data missing. User ID: ${args[0]}`;
    alert.classList.add("red");alert.classList.add("active");
    if(auth.currentUser){
      setTimeout(() => {
        auth.signOut();
      }, 5000);
    };
    return
  }
  else {
    alert.textContent = `Error occured:\n${err}`;
    alert.classList.add("red");alert.classList.add("active");
    console.error(err);
  }
};

function UpdatePage(page, subpage) {
  const location = window.location.pathname;
  if(location != `${page}`){
    if(subpage) {
      history.pushState({}, '', `${page}${subpage}`);
    }
    else {
      history.pushState({}, '', `${page}`);
    };
  };

  document.querySelector("nav").innerHTML = `
  <a href='/'>Home</a>
  <a href='/news'>News</a>
  <a href='/staff'>Staff</a>
  <a href='/accounts/settings'>Settings</a>
  `;

  if(auth.currentUser){
    document.querySelector("nav").innerHTML = `
    ${document.querySelector("nav").innerHTML}
    <a href='/accounts/logout'>Logout</a>
    `;
  }
  else {
    document.querySelector("nav").innerHTML = `
    ${document.querySelector("nav").innerHTML}
    <a href='/accounts/login'>Login</a>
    `;
  };


  setTimeout(() => {
    const navlist = document.querySelector("nav").querySelectorAll("a")
    for(let x=0; x < navlist.length; x++){
      navlist[x].addEventListener('click', (e) => {
        e.preventDefault();
        if(navlist[x].getAttribute('href').startsWith("http")){
          window.location.href = `${navlist[x].href}`;
          return;
        };
        UpdatePage(navlist[x].getAttribute('href'));
      });
    };

    contentLoadingScreen.style.display = 'flex';
    main.style.display = 'none';
    fullLoadingScreen.remove();

    setTimeout(() => {
      if(page == '/index'){
        UpdatePage('/')
      }
      else if(page in pages) {
        if(subpage) {
          pages[`${page}`](subpage);
        }
        else {
          pages[`${page}`]();
        };
      }
      else {
        pages['/404']();
      };
    }, 10);
  }, 50);
};

auth.onAuthStateChanged((user) => {
  if(user){
    if(!user.emailVerified){
      alert.textContent = 'Email not verified, please check your inbox and spam';
      alert.classList.add("active");
    };
  }
  else {
    alert.classList.remove("active");
  };

  if(window.location.pathname.split("/").length > 2) {
    let a = '';
    for(let x in window.location.pathname.split("/")){
      if(x == 0 || x == 1){continue};
      a = `${a}/${window.location.pathname.split("/")[x]}`;
    }
    UpdatePage(`/${window.location.pathname.split("/")[1]}`, a);
  }
  else {
    UpdatePage(window.location.pathname);
  }
});
