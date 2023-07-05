import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase objects
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

  const username = document.querySelector(".username");

  username.textContent = `guest`;

  let facts = [];

  db.collection("facts").get()
  .then((snap) => {
    snap.forEach((doc) => {
      facts.push(doc.id);
    });

    const fact = facts[Math.floor(Math.random() * facts.length)];

    db.collection("facts").doc(`${fact}`).get()
    .then((doc) => {
      main.querySelector(".fact").innerHTML = `
      <h2>Fact ${fact}:</h2>
      <p>${doc.data()['fact']}</p>`;

      let newslist = [];
      db.collection("news").get()
      .then((snap) => {
        snap.forEach((doc) => {newslist.push(doc.id);});

        newslist.sort(function(a,b){return a-b});newslist.reverse();newslist = newslist.slice(0,4);

        for(let x in newslist) {
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
            </div>`;
          });
        };

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

        addLinks();
        Loading(newslist.length, '.tile');
      });
    });
  });
};

pages['/news'] = function() {
  main.innerHTML = `
  <h1 class="section-title">All News</h1>
  <div class="tile-list"></div>`;

  const newslist = [];

  db.collection("news").get()
  .then((snap) => {
    snap.forEach((doc) => {newslist.push(doc.id);});

    newslist.sort(function(a,b){return a-b});newslist.reverse();

    for(let x in newslist) {
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
        </div>`;
      });
    };
    
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

    addLinks();
    Loading(newslist.length, '.tile');
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
    alert.classList.add("red");alert.classList.add("active");return;
  })
  .then(() => {
    Loading(0, 0);
  })
}

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
  let count

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
    alert.classList.add("red");alert.classList.add("active");return;
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
    alert.classList.add("red");alert.classList.add("active");return;
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
    alert.classList.add("red");alert.classList.add("active");return;
  })

  .then(() => {
    Loading(count, ".tile");
  });
};

pages['/accounts'] = function(page) {
  const user = undefined;
  if(!page || !`/accounts${page}` in pages || (!user && page != '/settings')) {
    UpdatePage('/404')
  }
  else {
    UpdatePage(`/accounts${page}`);
  };
};

pages['/accounts'] = function(page) {
  const user = undefined;
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

  const user = undefined;
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

  addLinks();
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
  if((count != checker) && count != main.querySelectorAll(`${checker}`).length) {
    setTimeout(() => {
      Loading(count, checker);
    }, 100);
    return;
  };

  main.style.display = 'block';
  contentLoadingScreen.style.display = 'none';
};

function Errors(err, args) {
  alert.textContent = `Error occured:\n${err}`;
  alert.classList.add("red");alert.classList.add("active");
  console.error(err);
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

window.addEventListener('load', () => {
  if(window.location.host.split(".")[1] != "skywarsnetwork") {window.location.replace("https://www.skywarsnetwork.com")};
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
  };
});
