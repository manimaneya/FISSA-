// ======================================================
// FISSA — SOCIAL COMPARISON PLATFORM
// Feed + A/B + Votes + Stories + Profiles + Publication
// ======================================================

import * as Firebase from "./firebase.js";

const auth = Firebase.auth;
const db = Firebase.db;

const {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} = Firebase;


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;

let authMode = "login";

let currentFilter = "all";

let currentCommentPost = null;

let toastTimer = null;

let localPosts =
  JSON.parse(
    localStorage.getItem("fissa_posts") || "[]"
  );

let localProfile =
  JSON.parse(
    localStorage.getItem("fissa_profile") || "{}"
  );


// ======================================================
// CATÉGORIES
// ======================================================

const categoryNames = {

  news: "📰 Actualité",
  music: "🎵 Musique",
  comedy: "😂 Comedy",
  sport: "⚽ Sport",
  world: "🌍 Monde",
  science: "🔬 Science",
  art: "🎨 Art"

};


// ======================================================
// POSTS DE DÉMONSTRATION
// ======================================================

const demoPosts = [

  {
    id:"fissa-ai-001",

    title:
      "FISSA AI — Quel contenu préfères-tu ?",

    description:
      "Bienvenue sur FISSA. Compare les deux créations et vote pour ton choix.",

    category:"world",

    author:
      "FISSA AI",

    authorAvatar:
      "AI",

    ai:true,

    mediaA:"",
    mediaB:"",

    typeA:"empty",
    typeB:"empty",

    likesA:12,
    likesB:8,

    comments:[],

    song:true,

    createdAt:
      Date.now()
  },

  {
    id:"fissa-music-001",

    title:
      "🎵 Music Battle — A VS B",

    description:
      "Choisis ton favori et participe au classement FISSA.",

    category:"music",

    author:
      "FISSA AI",

    authorAvatar:
      "AI",

    ai:true,

    mediaA:"",
    mediaB:"",

    typeA:"empty",
    typeB:"empty",

    likesA:21,
    likesB:17,

    comments:[],

    song:true,

    createdAt:
      Date.now() - 1000
  }

];


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    startMathBackground();

    renderFeed();

    setupAuth();

  }
);


// ======================================================
// AUTH FIREBASE
// ======================================================

function setupAuth(){

  if(
    auth &&
    typeof onAuthStateChanged === "function"
  ){

    onAuthStateChanged(
      auth,
      user => {

        currentUser = user;

        updateAccountInterface();

      }
    );

  }else{

    updateAccountInterface();

  }

}


// ======================================================
// COMPTE
// ======================================================

function updateAccountInterface(){

  const login =
    document.getElementById("loginButton");

  const avatar =
    document.getElementById("userAvatar");

  if(!login || !avatar) return;

  if(currentUser){

    login.classList.add("hidden");

    avatar.classList.remove("hidden");

    const letter =
      (
        currentUser.displayName ||
        currentUser.email ||
        "U"
      )
      .charAt(0)
      .toUpperCase();

    avatar.textContent = letter;

  }else{

    login.classList.remove("hidden");

    avatar.classList.add("hidden");

  }

}


// ======================================================
// AUTH MODAL
// ======================================================

window.openAuth =
function(mode="login"){

  authMode = mode;

  const modal =
    document.getElementById("authModal");

  const title =
    document.getElementById("authTitle");

  const name =
    document.getElementById("authName");

  const button =
    document.querySelector(
      "#authModal .publish-main-button"
    );

  const switchButton =
    document.getElementById("switchAuth");

  modal.classList.add("show");

  if(mode === "register"){

    title.textContent =
      "Créer un compte FISSA";

    name.classList.remove("hidden");

    button.textContent =
      "Créer mon compte";

    switchButton.textContent =
      "J'ai déjà un compte";

  }else{

    title.textContent =
      "Connexion FISSA";

    name.classList.add("hidden");

    button.textContent =
      "Se connecter";

    switchButton.textContent =
      "Créer un compte";

  }

};


window.closeAuth =
function(){

  document
    .getElementById("authModal")
    .classList.remove("show");

};


window.switchAuth =
function(){

  openAuth(
    authMode === "login"
      ? "register"
      : "login"
  );

};


// ======================================================
// AUTH SUBMIT
// ======================================================

window.submitAuth =
async function(){

  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      .value;

  const name =
    document
      .getElementById("authName")
      .value
      .trim();

  if(!email){

    showToast("Entre ton e-mail.");

    return;

  }

  if(password.length < 6){

    showToast(
      "Mot de passe : 6 caractères minimum."
    );

    return;

  }

  if(
    !auth ||
    typeof createUserWithEmailAndPassword !==
    "function"
  ){

    showToast(
      "Firebase Auth n'est pas configuré."
    );

    return;

  }

  try{

    if(authMode === "register"){

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      if(
        name &&
        typeof updateProfile === "function"
      ){

        await updateProfile(
          result.user,
          {
            displayName:name
          }
        );

      }

      showToast(
        "Compte créé 🎉"
      );

    }else{

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      showToast(
        "Connexion réussie ✅"
      );

    }

    closeAuth();

  }catch(error){

    console.error(error);

    showToast(
      firebaseMessage(error)
    );

  }

};


// ======================================================
// LOGOUT
// ======================================================

window.logout =
async function(){

  if(
    auth &&
    typeof signOut === "function"
  ){

    await signOut(auth);

  }

  showToast(
    "Déconnexion réussie."
  );

  goHome();

};


// ======================================================
// FIREBASE ERROR
// ======================================================

function firebaseMessage(error){

  const messages = {

    "auth/email-already-in-use":
      "Cet e-mail possède déjà un compte.",

    "auth/invalid-email":
      "Adresse e-mail invalide.",

    "auth/invalid-credential":
      "E-mail ou mot de passe incorrect.",

    "auth/weak-password":
      "Mot de passe trop faible.",

    "auth/network-request-failed":
      "Connexion Internet impossible."

  };

  return (
    messages[error.code] ||
    error.message ||
    "Erreur Firebase."
  );

}


// ======================================================
// PROFIL
// ======================================================

window.openProfile =
function(){

  if(!currentUser){

    openAuth("login");

    return;

  }

  document
    .getElementById("homePage")
    .classList.add("hidden");

  document
    .getElementById("profilePage")
    .classList.remove("hidden");

  const name =
    currentUser.displayName ||
    "Utilisateur FISSA";

  const email =
    currentUser.email ||
    "";

  document
    .getElementById("profileName")
    .textContent = name;

  document
    .getElementById("profileEmail")
    .textContent = email;

  const posts =
    localPosts.filter(
      p =>
        p.authorUid ===
        currentUser.uid
    ).length;

  document
    .getElementById("profilePosts")
    .textContent = posts;

};


window.goHome =
function(){

  document
    .getElementById("profilePage")
    .classList.add("hidden");

  document
    .getElementById("homePage")
    .classList.remove("hidden");

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

};


// ======================================================
// PROFIL PHOTO
// ======================================================

window.changeProfilePhoto =
function(){

  const input =
    document.createElement("input");

  input.type = "file";

  input.accept =
    "image/*";

  input.onchange =
    event => {

      const file =
        event.target.files[0];

      if(!file) return;

      const reader =
        new FileReader();

      reader.onload =
        e => {

          localProfile.photo =
            e.target.result;

          localStorage.setItem(
            "fissa_profile",
            JSON.stringify(localProfile)
          );

          const box =
            document.getElementById(
              "profilePhoto"
            );

          box.innerHTML =
            `<img src="${e.target.result}" alt="Photo">`;

          showToast(
            "Photo de profil modifiée 📷"
          );

        };

      reader.readAsDataURL(file);

    };

  input.click();

};


// ======================================================
// PUBLICATION
// ======================================================

window.openPublish =
function(){

  if(!currentUser){

    openAuth("login");

    showToast(
      "Connecte-toi pour publier."
    );

    return;

  }

  document
    .getElementById("publishModal")
    .classList.add("show");

};


window.closePublish =
function(){

  document
    .getElementById("publishModal")
    .classList.remove("show");

};


// ======================================================
// PREVIEW UPLOAD
// ======================================================

window.previewUpload =
function(side,input){

  const file =
    input.files[0];

  if(!file) return;

  const box =
    document.getElementById(
      "preview" + side
    );

  const url =
    URL.createObjectURL(file);

  if(file.type.startsWith("video/")){

    box.innerHTML =
      `<video src="${url}" controls></video>`;

  }else{

    box.innerHTML =
      `<img src="${url}" alt="Aperçu ${side}">`;

  }

};


// ======================================================
// PUBLICATION
// ======================================================

window.publishComparison =
async function(){

  if(!currentUser){

    closePublish();

    openAuth("login");

    return;

  }

  const title =
    document
      .getElementById("publishTitle")
      .value
      .trim();

  const description =
    document
      .getElementById("publishDescription")
      .value
      .trim();

  const category =
    document
      .getElementById("publishCategory")
      .value;

  const fileA =
    document
      .getElementById("fileA")
      .files[0];

  const fileB =
    document
      .getElementById("fileB")
      .files[0];

  const song =
    document
      .getElementById("songEnabled")
      .checked;

  if(!title){

    showToast(
      "Ajoute un titre."
    );

    return;

  }

  if(!fileA || !fileB){

    showToast(
      "Ajoute les médias A et B."
    );

    return;

  }

  showToast(
    "Préparation de la publication..."
  );


  const mediaA =
    await fileToData(fileA);

  const mediaB =
    await fileToData(fileB);


  const post = {

    id:
      "post-" +
      Date.now(),

    title,

    description,

    category,

    author:
      currentUser.displayName ||
      currentUser.email ||
      "Utilisateur FISSA",

    authorUid:
      currentUser.uid,

    authorAvatar:
      (
        currentUser.displayName ||
        currentUser.email ||
        "U"
      )
      .charAt(0)
      .toUpperCase(),

    ai:false,

    mediaA,

    mediaB,

    typeA:
      fileA.type.startsWith("video/")
        ? "video"
        : "image",

    typeB:
      fileB.type.startsWith("video/")
        ? "video"
        : "image",

    likesA:0,
    likesB:0,

    comments:[],

    song,

    createdAt:
      Date.now()

  };


  localPosts.unshift(post);

  saveLocalPosts();

  await savePostToFirestore(post);

  closePublish();

  resetPublishForm();

  renderFeed();

  showToast(
    "Publication ajoutée au fil FISSA 🚀"
  );

};


// ======================================================
// CONVERT FILE
// ======================================================

function fileToData(file){

  return new Promise(
    resolve => {

      const reader =
        new FileReader();

      reader.onload =
        e =>
          resolve(e.target.result);

      reader.readAsDataURL(file);

    }
  );

}


// ======================================================
// FIRESTORE
// ======================================================

async function savePostToFirestore(post){

  if(!db){

    console.warn(
      "Firestore db non disponible."
    );

    return;

  }

  try{

    // Compatible si firebase.js expose une fonction
    // saveFissaPost personnalisée.

    if(
      typeof Firebase.saveFissaPost ===
      "function"
    ){

      await Firebase.saveFissaPost(post);

      return;

    }

    console.warn(
      "Ajoute saveFissaPost dans firebase.js pour Firestore."
    );

  }catch(error){

    console.error(
      "Firestore:",
      error
    );

  }

}


// ======================================================
// LOCAL STORAGE
// ======================================================

function saveLocalPosts(){

  try{

    localStorage.setItem(
      "fissa_posts",
      JSON.stringify(localPosts)
    );

  }catch(error){

    console.warn(
      "Stockage local limité:",
      error
    );

  }

}


// ======================================================
// GET POSTS
// ======================================================

function getPosts(){

  const combined =
    [
      ...localPosts,
      ...demoPosts
    ];

  const ids =
    new Set();

  return combined
    .filter(
      post => {

        if(ids.has(post.id))
          return false;

        ids.add(post.id);

        return true;

      }
    )
    .sort(
      (a,b) =>
        b.createdAt -
        a.createdAt
    );

}


// ======================================================
// FILTRE
// ======================================================

window.setFilter =
function(filter,button){

  currentFilter =
    filter;

  document
    .querySelectorAll(".filter")
    .forEach(
      item =>
        item.classList.remove(
          "active"
        )
    );

  button.classList.add(
    "active"
  );

  renderFeed();

};


// ======================================================
// SEARCH
// ======================================================

window.searchPosts =
function(value){

  renderFeed(
    value.trim().toLowerCase()
  );

};


// ======================================================
// RENDER FEED
// ======================================================

function renderFeed(search=""){

  const feed =
    document.getElementById(
      "feedList"
    );

  if(!feed) return;

  let posts =
    getPosts();


  if(currentFilter !== "all"){

    posts =
      posts.filter(
        post =>
          post.category ===
          currentFilter
      );

  }


  if(search){

    posts =
      posts.filter(
        post =>
          (
            post.title +
            " " +
            post.description +
            " " +
            post.author
          )
          .toLowerCase()
          .includes(search)
      );

  }


  document
    .getElementById("postCount")
    .textContent =
      posts.length +
      (
        posts.length > 1
          ? " publications"
          : " publication"
      );


  if(!posts.length){

    feed.innerHTML =
      `
      <div class="empty">
        <div style="font-size:40px">🔎</div>
        <p>Aucune publication trouvée.</p>
      </div>
      `;

    return;

  }


  feed.innerHTML =
    posts
      .map(
        post =>
          createPostHTML(post)
      )
      .join("");


  posts.forEach(
    post =>
      preparePostMedia(post)
  );

}


// ======================================================
// POST HTML
// ======================================================

function createPostHTML(post){

  const total =
    post.likesA +
    post.likesB;

  const percentA =
    total
      ? Math.round(
          post.likesA /
          total *
          100
        )
      : 50;

  const percentB =
    100 -
    percentA;


  return `

  <article
    class="post"
    id="post-${escapeHTML(post.id)}"
  >

    <div class="post-head">

      <div class="post-avatar">
        ${escapeHTML(
          post.authorAvatar ||
          "U"
        )}
      </div>

      <div class="post-user">

        <strong>
          ${escapeHTML(post.author)}
        </strong>

        <small>
          ${timeAgo(post.createdAt)}
        </small>

      </div>

      ${
        post.ai
          ? `<span class="ai-badge">🤖 FISSA AI</span>`
          : ""
      }

      <span class="category-badge">
        ${
          categoryNames[
            post.category
          ] ||
          "🌍 Monde"
        }
      </span>

    </div>


    <div class="post-content">

      <h2>
        ${escapeHTML(post.title)}
      </h2>

      <p>
        ${escapeHTML(
          post.description || ""
        )}
      </p>

    </div>


    <div class="ab-grid">

      ${createSideHTML(
        post,
        "A"
      )}

      ${createSideHTML(
        post,
        "B"
      )}

    </div>


    ${
      post.song
        ? `
        <button
          class="song-button show"
          onclick="playSong('${escapeHTML(post.id)}')"
        >
          🎵 Song
        </button>
        `
        : ""
    }


    <div class="score">

      <div class="score-info">

        <span>
          🔵 A ${percentA}%
        </span>

        <span>
          ${percentB}% B 🔴
        </span>

      </div>

      <div class="score-bar">

        <div
          id="scoreA-${escapeHTML(post.id)}"
          class="score-a"
          style="width:${percentA}%"
        ></div>

        <div
          id="scoreB-${escapeHTML(post.id)}"
          class="score-b"
          style="width:${percentB}%"
        ></div>

      </div>

    </div>


    <div class="post-actions">

      <button
        class="post-action"
        onclick="votePost('${escapeHTML(post.id)}','A',this)"
      >
        ❤️ A
        <span>
          ${post.likesA}
        </span>
      </button>

      <button
        class="post-action"
        onclick="votePost('${escapeHTML(post.id)}','B',this)"
      >
        ❤️ B
        <span>
          ${post.likesB}
        </span>
      </button>

      <button
        class="post-action"
        onclick="openComments('${escapeHTML(post.id)}')"
      >
        💬 Commenter
      </button>

      <button
        class="post-action"
        onclick="sharePost('${escapeHTML(post.id)}')"
      >
        ↗ Partager
      </button>

    </div>

  </article>

  `;

}


// ======================================================
// SIDE A / B
// ======================================================

function createSideHTML(post,side){

  const media =
    side === "A"
      ? post.mediaA
      : post.mediaB;

  const type =
    side === "A"
      ? post.typeA
      : post.typeB;


  let mediaHTML =
    `
    <div class="media-placeholder-inner">
      🎬
    </div>
    `;


  if(media){

    if(type === "video"){

      mediaHTML =
        `
        <video
          id="video-${post.id}-${side}"
          class="side-media"
          playsinline
          preload="metadata"
          src="${media}"
        ></video>
        `;

    }else{

      mediaHTML =
        `
        <img
          class="side-media"
          src="${media}"
          alt="Création ${side}"
        >
        `;

    }

  }


  return `

  <div
    class="side side-${side.toLowerCase()}"
    data-post="${escapeHTML(post.id)}"
  >

    <div class="side-label">
      ${side}
    </div>

    ${mediaHTML}

    ${
      type === "video"
        ? `
        <button
          class="media-controls play-big"
          onclick="toggleVideo('${escapeHTML(post.id)}','${side}',this)"
        >
          ▶
        </button>

        <div class="media-controls">

          <span></span>

          <button
            onclick="toggleMute('${escapeHTML(post.id)}','${side}')"
          >
            🔊
          </button>

        </div>
        `
        : ""
    }

  </div>

  `;

}


// ======================================================
// PREPARE MEDIA
// ======================================================

function preparePostMedia(post){

  if(
    post.typeA === "video"
  ){

    const video =
      document.getElementById(
        `video-${post.id}-A`
      );

    if(video){

      video.addEventListener(
        "ended",
        () => {

          const button =
            video.parentElement
              .querySelector(
                ".play-big"
              );

          if(button)
            button.textContent = "▶";

        }
      );

    }

  }

}


// ======================================================
// PLAY VIDEO
// ======================================================

window.toggleVideo =
function(id,side,button){

  const video =
    document.getElementById(
      `video-${id}-${side}`
    );

  if(!video) return;

  if(video.paused){

    video.play()
      .then(
        () => {

          button.textContent =
            "❚❚";

          button.classList.add(
            "playing"
          );

        }
      )
      .catch(
        () =>
          showToast(
            "Appuie encore sur ▶️"
          )
      );

  }else{

    video.pause();

    button.textContent =
      "▶";

    button.classList.remove(
      "playing"
    );

  }

};


// ======================================================
// MUTE
// ======================================================

window.toggleMute =
function(id,side){

  const video =
    document.getElementById(
      `video-${id}-${side}`
    );

  if(!video) return;

  video.muted =
    !video.muted;

  showToast(
    video.muted
      ? "Son désactivé 🔇"
      : "Son activé 🔊"
  );

};


// ======================================================
// SONG
// ======================================================

window.playSong =
function(id){

  showToast(
    "🎵 Lecteur Song FISSA — audio à connecter"
  );

};


// ======================================================
// VOTE
// ======================================================

window.votePost =
function(id,side,button){

  const post =
    getPosts()
      .find(
        p =>
          p.id === id
      );

  if(!post) return;


  if(side === "A"){

    post.likesA++;

  }else{

    post.likesB++;

  }


  updateLocalPost(post);

  renderFeed();

  showToast(
    `Vote pour ${side} enregistré ❤️`
  );

};


// ======================================================
// UPDATE LOCAL POST
// ======================================================

function updateLocalPost(post){

  const index =
    localPosts.findIndex(
      p =>
        p.id === post.id
    );

  if(index >= 0){

    localPosts[index] =
      post;

    saveLocalPosts();

  }

}


// ======================================================
// COMMENTS
// ======================================================

window.openComments =
function(id){

  currentCommentPost =
    id;

  const post =
    getPosts()
      .find(
        p =>
          p.id === id
      );

  if(!post) return;


  const list =
    document.getElementById(
      "modalComments"
    );

  list.innerHTML =
    "";


  if(
    !post.comments ||
    !post.comments.length
  ){

    list.innerHTML =
      `
      <div class="empty">
        Aucun commentaire pour le moment.
      </div>
      `;

  }else{

    post.comments
      .forEach(
        comment => {

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "modal-comment";

          item.innerHTML =
            `
            <strong>
              ${escapeHTML(
                comment.author
              )}
            </strong>
            <br>
            ${escapeHTML(
              comment.text
            )}
            `;

          list.appendChild(
            item
          );

        }
      );

  }


  document
    .getElementById(
      "commentModal"
    )
    .classList.add("show");

};


window.closeComment =
function(){

  document
    .getElementById(
      "commentModal"
    )
    .classList.remove("show");

};


// ======================================================
// SEND COMMENT
// ======================================================

window.sendComment =
function(event){

  event.preventDefault();

  if(!currentCommentPost)
    return;


  const input =
    document.getElementById(
      "modalCommentInput"
    );

  const text =
    input.value.trim();

  if(!text)
    return;


  const post =
    getPosts()
      .find(
        p =>
          p.id ===
          currentCommentPost
      );

  if(!post)
    return;


  if(!post.comments)
    post.comments = [];


  post.comments.push({

    author:
      currentUser
        ? (
            currentUser.displayName ||
            currentUser.email
          )
        : "Visiteur",

    text,

    createdAt:
      Date.now()

  });


  updateLocalPost(post);

  input.value = "";

  openComments(
    currentCommentPost
  );

  showToast(
    "Commentaire publié 💬"
  );

};


// ======================================================
// SHARE
// ======================================================

window.sharePost =
async function(id){

  const post =
    getPosts()
      .find(
        p =>
          p.id === id
      );

  if(!post)
    return;


  const data = {

    title:
      "FISSA — " +
      post.title,

    text:
      "Regarde cette comparaison sur FISSA 🌍",

    url:
      window.location.href +
      "#post-" +
      id

  };


  try{

    if(navigator.share){

      await navigator.share(
        data
      );

    }else{

      await navigator.clipboard.writeText(
        data.url
      );

      showToast(
        "Lien copié 📋"
      );

    }

  }catch(error){

    console.log(error);

  }

};


// ======================================================
// RESET PUBLISH
// ======================================================

function resetPublishForm(){

  document.getElementById(
    "publishTitle"
  ).value = "";

  document.getElementById(
    "publishDescription"
  ).value = "";

  document.getElementById(
    "fileA"
  ).value = "";

  document.getElementById(
    "fileB"
  ).value = "";

  document.getElementById(
    "songEnabled"
  ).checked = false;

  document.getElementById(
    "previewA"
  ).innerHTML = "🎬";

  document.getElementById(
    "previewB"
  ).innerHTML = "🎬";

}


// ======================================================
// NAVIGATION
// ======================================================

window.scrollToFeed =
function(){

  document
    .getElementById("feed")
    .scrollIntoView({
      behavior:"smooth"
    });

};


// ======================================================
// TOAST
// ======================================================

window.showToast =
function(message){

  const toast =
    document.getElementById(
      "toast"
    );

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2800
    );

};


// ======================================================
// CLOSE MODALS ON BACKGROUND
// ======================================================

document.addEventListener(
  "click",
  event => {

    if(
      event.target.classList.contains(
        "modal"
      )
    ){

      event.target.classList.remove(
        "show"
      );

    }

  }
);


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


// ======================================================
// TIME AGO
// ======================================================

function timeAgo(timestamp){

  const seconds =
    Math.floor(
      (
        Date.now() -
        timestamp
      ) / 1000
    );

  if(seconds < 60)
    return "à l'instant";

  const minutes =
    Math.floor(
      seconds / 60
    );

  if(minutes < 60)
    return `il y a ${minutes} min`;

  const hours =
    Math.floor(
      minutes / 60
    );

  if(hours < 24)
    return `il y a ${hours} h`;

  const days =
    Math.floor(
      hours / 24
    );

  return `il y a ${days} j`;

}


// ======================================================
// MATH BACKGROUND
// ======================================================

function startMathBackground(){

  const canvas =
    document.getElementById(
      "mathCanvas"
    );

  if(!canvas)
    return;

  const ctx =
    canvas.getContext("2d");

  let particles = [];


  function resize(){

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;

    particles = [];


    for(
      let i=0;
      i<55;
      i++
    ){

      particles.push({

        x:
          Math.random() *
          canvas.width,

        y:
          Math.random() *
          canvas.height,

        vx:
          (
            Math.random() -
            .5
          ) * .35,

        vy:
          (
            Math.random() -
            .5
          ) * .35,

        r:
          Math.random() * 1.8 + .5

      });

    }

  }


  function draw(){

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    particles.forEach(
      (p,i) => {

        p.x += p.vx;
        p.y += p.vy;


        if(
          p.x < 0 ||
          p.x > canvas.width
        )
          p.vx *= -1;


        if(
          p.y < 0 ||
          p.y > canvas.height
        )
          p.vy *= -1;


        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI*2
        );

        ctx.fillStyle =
          "rgba(0,229,255,.6)";

        ctx.fill();


        for(
          let j=i+1;
          j<particles.length;
          j++
        ){

          const q =
            particles[j];

          const dx =
            p.x-q.x;

          const dy =
            p.y-q.y;

          const distance =
            Math.sqrt(
              dx*dx+
              dy*dy
            );


          if(distance < 115){

            ctx.beginPath();

            ctx.moveTo(
              p.x,
              p.y
            );

            ctx.lineTo(
              q.x,
              q.y
            );

            ctx.strokeStyle =
              `rgba(
                0,
                229,
                255,
                ${.1-distance/1300}
              )`;

            ctx.stroke();

          }

        }

      }
    );


    requestAnimationFrame(
      draw
    );

  }


  window.addEventListener(
    "resize",
    resize
  );

  resize();
  draw();

}
