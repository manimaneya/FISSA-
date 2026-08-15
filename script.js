// ============================================================
// FISSA — SCRIPT.JS
// Système principal : Auth + Publication + Actualités + A/B
// Média + Play + Son + Story + Vote + Commentaire + Profil
// ============================================================

import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "./firebase.js";

// ============================================================
// CONFIGURATION
// ============================================================

const APP_NAME = "FISSA";

let authMode = "login";
let toastTimer = null;

let currentMedia = {
  A: null,
  B: null
};

let votes = {
  A: 0,
  B: 0
};

let publications = [];
let stories = [];

let currentFilter = "all";


// ============================================================
// OUTILS
// ============================================================

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}


function getCurrentUserName() {
  const user = auth.currentUser;

  if (!user) {
    return "Visiteur";
  }

  return (
    user.displayName ||
    user.email?.split("@")[0] ||
    "Utilisateur FISSA"
  );
}


function getInitial(name) {
  return (
    name ||
    "F"
  ).charAt(0).toUpperCase();
}


// ============================================================
// TOAST
// ============================================================

window.showToast = function(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
};


// ============================================================
// AUTHENTIFICATION
// ============================================================

window.openAuth = function(mode = "login") {

  authMode = mode;

  const modal = $("authModal");

  const title = $("authTitle");

  const name = $("authName");

  const submit = $("authSubmit");

  const switchButton = $("switchAuth");

  if (!modal) return;

  modal.classList.add("show");

  if (mode === "register") {

    if (title) {
      title.textContent = "Créer un compte FISSA";
    }

    if (name) {
      name.classList.remove("hidden");
    }

    if (submit) {
      submit.textContent = "Créer mon compte";
    }

    if (switchButton) {
      switchButton.textContent =
        "J'ai déjà un compte — Me connecter";
    }

  } else {

    if (title) {
      title.textContent = "Connexion FISSA";
    }

    if (name) {
      name.classList.add("hidden");
    }

    if (submit) {
      submit.textContent = "Se connecter";
    }

    if (switchButton) {
      switchButton.textContent =
        "Créer un nouveau compte";
    }
  }
};


window.closeAuth = function() {

  const modal = $("authModal");

  if (modal) {
    modal.classList.remove("show");
  }
};


window.switchAuth = function() {

  if (authMode === "login") {
    openAuth("register");
  } else {
    openAuth("login");
  }
};


window.submitAuth = async function() {

  const nameInput = $("authName");
  const emailInput = $("authEmail");
  const passwordInput = $("authPassword");

  const name =
    nameInput?.value.trim() || "";

  const email =
    emailInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

  if (!email) {
    showToast("Entre ton adresse e-mail.");
    return;
  }

  if (!password) {
    showToast("Entre ton mot de passe.");
    return;
  }

  if (password.length < 6) {
    showToast(
      "Le mot de passe doit contenir au moins 6 caractères."
    );
    return;
  }

  try {

    if (authMode === "register") {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (name) {

        await updateProfile(
          result.user,
          {
            displayName: name
          }
        );
      }

      showToast(
        "Compte FISSA créé 🎉"
      );

    } else {

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
    clearAuthForm();

  } catch (error) {

    console.error(
      "Erreur Firebase:",
      error
    );

    showFirebaseError(error);
  }
};


window.logout = async function() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie."
    );

    goHome();

  } catch (error) {

    console.error(error);

    showToast(
      "Erreur de déconnexion."
    );
  }
};


function clearAuthForm() {

  if ($("authName")) {
    $("authName").value = "";
  }

  if ($("authEmail")) {
    $("authEmail").value = "";
  }

  if ($("authPassword")) {
    $("authPassword").value = "";
  }
}


function showFirebaseError(error) {

  const errors = {

    "auth/email-already-in-use":
      "Cet e-mail possède déjà un compte.",

    "auth/invalid-email":
      "Adresse e-mail invalide.",

    "auth/weak-password":
      "Mot de passe trop faible.",

    "auth/invalid-credential":
      "E-mail ou mot de passe incorrect.",

    "auth/user-not-found":
      "Aucun compte avec cet e-mail.",

    "auth/wrong-password":
      "Mot de passe incorrect.",

    "auth/too-many-requests":
      "Trop de tentatives. Réessaie plus tard.",

    "auth/network-request-failed":
      "Vérifie ta connexion Internet."
  };

  showToast(
    errors[error.code] ||
    error.message ||
    "Erreur Firebase."
  );
}


// ============================================================
// ÉTAT UTILISATEUR
// ============================================================

onAuthStateChanged(
  auth,
  user => {

    updateUserInterface(user);

    renderProfile(user);
  }
);


function updateUserInterface(user) {

  const loginButton = $("loginButton");
  const userAvatar = $("userAvatar");

  if (user) {

    if (loginButton) {
      loginButton.classList.add("hidden");
    }

    if (userAvatar) {

      userAvatar.classList.remove("hidden");

      userAvatar.textContent =
        getInitial(
          user.displayName ||
          user.email
        );
    }

  } else {

    if (loginButton) {
      loginButton.classList.remove("hidden");
    }

    if (userAvatar) {
      userAvatar.classList.add("hidden");
    }
  }
}


// ============================================================
// PROFIL UTILISATEUR
// ============================================================

window.openProfile = function() {

  const user = auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  renderProfile(user);

  const profile =
    $("profilePage");

  if (profile) {

    profile.classList.remove(
      "hidden"
    );

    profile.scrollIntoView({
      behavior: "smooth"
    });
  }
};


function renderProfile(user) {

  if (!user) return;

  const name =
    user.displayName ||
    "Utilisateur FISSA";

  const email =
    user.email ||
    "";

  if ($("profileName")) {
    $("profileName").textContent =
      name;
  }

  if ($("profileEmail")) {
    $("profileEmail").textContent =
      email;
  }

  if ($("profileUid")) {
    $("profileUid").textContent =
      "ID utilisateur : " +
      user.uid;
  }

  const profileAvatar =
    $("profileAvatar");

  if (profileAvatar) {
    profileAvatar.textContent =
      getInitial(name);
  }

  const profilePhoto =
    $("profilePhoto");

  if (
    profilePhoto &&
    user.photoURL
  ) {

    profilePhoto.src =
      user.photoURL;

    profilePhoto.style.display =
      "block";
  }
}


// ============================================================
// NAVIGATION
// ============================================================

window.goHome = function() {

  const sections = [
    "profilePage",
    "storyPage",
    "publishPage"
  ];

  sections.forEach(id => {

    const element = $(id);

    if (element) {
      element.classList.add("hidden");
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


window.goBack = function() {

  if (
    window.history.length > 1
  ) {

    window.history.back();

  } else {

    goHome();
  }
};


window.scrollToComparison =
function() {

  const element =
    $("comparison");

  if (element) {

    element.scrollIntoView({
      behavior: "smooth"
    });
  }
};


window.scrollToComments =
function() {

  const element =
    $("comments");

  if (element) {

    element.scrollIntoView({
      behavior: "smooth"
    });
  }
};


// ============================================================
// MÉDIA A / B
// ============================================================

window.loadMedia = function(
  event,
  side
) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const image =
    $("image" + side);

  const video =
    $("video" + side);

  const placeholder =
    $("placeholder" + side);

  if (!image || !video) return;

  const url =
    URL.createObjectURL(file);

  image.style.display =
    "none";

  video.style.display =
    "none";

  currentMedia[side] = {
    file,
    url,
    type: file.type
  };

  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    image.src = url;

    image.style.display =
      "block";

  }

  else if (
    file.type.startsWith(
      "video/"
    )
  ) {

    video.src = url;

    video.muted = false;

    video.playsInline = true;

    video.controls = true;

    video.style.display =
      "block";

    addVideoControls(
      video,
      side
    );
  }

  if (placeholder) {

    placeholder.style.display =
      "none";
  }

  showToast(
    "Média " +
    side +
    " ajouté ✅"
  );
};


// ============================================================
// CONTRÔLES VIDÉO : ▶️ + 🔊
// ============================================================

function addVideoControls(
  video,
  side
) {

  const media =
    video.parentElement;

  if (!media) return;

  let controls =
    media.querySelector(
      ".fissa-video-controls"
    );

  if (controls) {
    controls.remove();
  }

  controls =
    document.createElement(
      "div"
    );

  controls.className =
    "fissa-video-controls";

  controls.innerHTML = `

    <button
      type="button"
      class="video-play-btn"
      title="Lecture / Pause"
    >
      ▶️
    </button>

    <button
      type="button"
      class="video-sound-btn"
      title="Son"
    >
      🔊
    </button>

    <span class="video-time">
      00:00
    </span>

  `;

  media.appendChild(
    controls
  );

  const playButton =
    controls.querySelector(
      ".video-play-btn"
    );

  const soundButton =
    controls.querySelector(
      ".video-sound-btn"
    );

  const time =
    controls.querySelector(
      ".video-time"
    );


  playButton.onclick = async () => {

    if (video.paused) {

      try {

        await video.play();

      } catch (error) {

        console.log(error);
      }

    } else {

      video.pause();
    }
  };


  soundButton.onclick = () => {

    video.muted =
      !video.muted;

    soundButton.textContent =
      video.muted
        ? "🔇"
        : "🔊";
  };


  video.addEventListener(
    "play",
    () => {

      playButton.textContent =
        "⏸️";
    }
  );


  video.addEventListener(
    "pause",
    () => {

      playButton.textContent =
        "▶️";
    }
  );


  video.addEventListener(
    "timeupdate",
    () => {

      time.textContent =
        formatTime(
          video.currentTime
        );
    }
  );
}


function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}


// ============================================================
// MODE VERTICAL
// ============================================================

window.toggleVerticalMode =
function() {

  document.body.classList.toggle(
    "vertical-mode"
  );

  const active =
    document.body.classList.contains(
      "vertical-mode"
    );

  showToast(
    active
      ? "Mode vertical activé 📱"
      : "Mode normal activé"
  );
};


// ============================================================
// VOTE A / B
// ============================================================

window.vote = function(
  side,
  button
) {

  if (
    side !== "A" &&
    side !== "B"
  ) {
    return;
  }

  votes[side]++;

  const counter =
    $("likes" + side);

  if (counter) {
    counter.textContent =
      votes[side];
  }

  if (button) {
    button.classList.add(
      "active"
    );
  }

  updateScore();

  showToast(
    "Ton vote pour " +
    side +
    " a été enregistré ❤️"
  );
};


function updateScore() {

  const total =
    votes.A + votes.B;

  let percentA = 50;
  let percentB = 50;

  if (total > 0) {

    percentA =
      Math.round(
        votes.A /
        total *
        100
      );

    percentB =
      100 - percentA;
  }

  if ($("scoreA")) {
    $("scoreA").style.width =
      percentA + "%";
  }

  if ($("scoreB")) {
    $("scoreB").style.width =
      percentB + "%";
  }

  if ($("percentA")) {
    $("percentA").textContent =
      percentA + "%";
  }

  if ($("percentB")) {
    $("percentB").textContent =
      percentB + "%";
  }
}


// ============================================================
// COMMENTAIRES
// ============================================================

window.addComment =
function(event) {

  event.preventDefault();

  const input =
    $("commentInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  const comment =
    document.createElement(
      "div"
    );

  comment.className =
    "comment";

  const strong =
    document.createElement(
      "strong"
    );

  strong.textContent =
    getCurrentUserName();

  comment.appendChild(
    strong
  );

  comment.appendChild(
    document.createTextNode(
      " " + text
    )
  );

  const list =
    $("commentsList");

  if (list) {
    list.prepend(comment);
  }

  input.value = "";

  showToast(
    "Commentaire publié 💬"
  );
};


window.commentFor =
function(side) {

  const input =
    $("commentInput");

  if (!input) return;

  input.placeholder =
    "Ton avis sur la création " +
    side +
    "...";

  input.focus();

  scrollToComments();
};


// ============================================================
// PARTAGE
// ============================================================

window.sharePost =
async function(side) {

  const data = {

    title:
      "FISSA — Création " +
      side,

    text:
      "Regarde cette comparaison sur FISSA !",

    url:
      window.location.href
  };

  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        data
      );

      showToast(
        "Partage effectué 📤"
      );

    }

    else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié 📋"
      );
    }

  } catch (error) {

    console.log(
      "Partage annulé",
      error
    );
  }
};


// ============================================================
// PUBLICATION
// ============================================================

window.openModal =
function() {

  const user =
    auth.currentUser;

  if (!user) {

    showToast(
      "Connecte-toi pour publier."
    );

    openAuth("login");

    return;
  }

  const modal =
    $("modal");

  if (modal) {

    modal.classList.add(
      "show"
    );
  }
};


window.closeModal =
function() {

  const modal =
    $("modal");

  if (modal) {

    modal.classList.remove(
      "show"
    );
  }
};


// ============================================================
// PUBLIER UNE COMPARAISON
// ============================================================

window.publishComparison =
function() {

  const user =
    auth.currentUser;

  if (!user) {

    closeModal();

    openAuth("login");

    return;
  }

  const title =
    $("titleInput")?.value.trim();

  const description =
    $("descriptionInput")?.value.trim();

  if (!title) {

    showToast(
      "Ajoute un titre."
    );

    return;
  }


  const publication = {

    id:
      Date.now(),

    title,

    description,

    author:
      user.displayName ||
      user.email?.split("@")[0] ||
      "Utilisateur FISSA",

    authorId:
      user.uid,

    createdAt:
      new Date(),

    mediaA:
      currentMedia.A,

    mediaB:
      currentMedia.B,

    category:
      "actualité"
  };


  publications.unshift(
    publication
  );


  renderPublications();


  closeModal();


  if ($("titleInput")) {
    $("titleInput").value = "";
  }

  if ($("descriptionInput")) {
    $("descriptionInput").value = "";
  }


  showToast(
    "Publication ajoutée aux actualités 🚀"
  );


  scrollToNews();
};


// ============================================================
// FIL D'ACTUALITÉ
// ============================================================

function renderPublications() {

  let container =
    $("newsFeed");

  if (!container) {

    container =
      document.querySelector(
        ".news-feed"
      );
  }

  if (!container) return;


  container.innerHTML = "";


  if (
    publications.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-feed">

        <div>
          📰
        </div>

        <h3>
          Aucune publication pour le moment
        </h3>

        <p>
          Publie une comparaison pour
          apparaître ici.
        </p>

      </div>

    `;

    return;
  }


  publications.forEach(
    publication => {

      const card =
        createPublicationCard(
          publication
        );

      container.appendChild(
        card
      );
    }
  );
}


function createPublicationCard(
  publication
) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "news-card";


  const authorInitial =
    getInitial(
      publication.author
    );


  card.innerHTML = `

    <div class="news-header">

      <div class="news-user">

        <div class="news-avatar">
          ${escapeHTML(authorInitial)}
        </div>

        <div>

          <strong>
            ${escapeHTML(publication.author)}
          </strong>

          <small>
            Publication FISSA • maintenant
          </small>

        </div>

      </div>

      <span class="news-badge">
        ACTUALITÉ
      </span>

    </div>


    <div class="news-body">

      <h3>
        ${escapeHTML(publication.title)}
      </h3>

      <p>
        ${escapeHTML(publication.description)}
      </p>

    </div>


    <div class="news-comparison">

      <div class="news-side news-a">

        <div class="news-letter">
          A
        </div>

        <div class="news-media">
          Création A
        </div>

      </div>


      <div class="news-vs">
        VS
      </div>


      <div class="news-side news-b">

        <div class="news-letter">
          B
        </div>

        <div class="news-media">
          Création B
        </div>

      </div>

    </div>


    <div class="news-actions">

      <button
        type="button"
        onclick="voteNews(${publication.id},'A',this)"
      >
        🔵 A
        <span>0</span>
      </button>

      <button
        type="button"
        onclick="voteNews(${publication.id},'B',this)"
      >
        🔴 B
        <span>0</span>
      </button>

      <button
        type="button"
        onclick="sharePublication(${publication.id})"
      >
        ↗ Partager
      </button>

    </div>

  `;


  return card;
}


// ============================================================
// VOTE ACTUALITÉ
// ============================================================

window.voteNews =
function(
  id,
  side,
  button
) {

  if (!button) return;

  button.classList.add(
    "active"
  );

  const span =
    button.querySelector(
      "span"
    );

  if (span) {

    span.textContent =
      Number(span.textContent || 0) +
      1;
  }

  showToast(
    "Vote " +
    side +
    " enregistré ❤️"
  );
};


// ============================================================
// PARTAGER PUBLICATION
// ============================================================

window.sharePublication =
async function(id) {

  const publication =
    publications.find(
      item => item.id === id
    );

  if (!publication) return;

  const text =
    "Découvrez \"" +
    publication.title +
    "\" sur FISSA.";

  try {

    if (navigator.share) {

      await navigator.share({

        title:
          "FISSA",

        text,

        url:
          window.location.href
      });

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié 📋"
      );
    }

  } catch (error) {

    console.log(error);
  }
};


// ============================================================
// ACTUALITÉS / FILTRES
// ============================================================

window.setNewsFilter =
function(filter) {

  currentFilter =
    filter;

  document
    .querySelectorAll(
      "[data-news-filter]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.newsFilter ===
        filter
      );
    });


  filterNews();
};


function filterNews() {

  const cards =
    document.querySelectorAll(
      ".news-card"
    );

  cards.forEach(card => {

    if (
      currentFilter ===
      "all"
    ) {

      card.style.display =
        "";

      return;
    }

    const badge =
      card.querySelector(
        ".news-badge"
      );

    const category =
      badge?.textContent
        ?.toLowerCase() ||
      "";

    card.style.display =
      category.includes(
        currentFilter
      )
        ? ""
        : "none";
  });
};


window.scrollToNews =
function() {

  const news =
    $("newsFeed") ||
    document.querySelector(
      ".news-feed"
    );

  if (news) {

    news.scrollIntoView({
      behavior: "smooth"
    });
  }
};


// ============================================================
// STORIES
// ============================================================

window.openStory =
function() {

  const user =
    auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const page =
    $("storyPage");

  if (page) {

    page.classList.remove(
      "hidden"
    );

    page.scrollIntoView({
      behavior: "smooth"
    });
  }
};


window.addStory =
function(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const user =
    auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const url =
    URL.createObjectURL(file);


  const story = {

    id:
      Date.now(),

    author:
      getCurrentUserName(),

    url,

    type:
      file.type,

    createdAt:
      Date.now()
  };


  stories.unshift(
    story
  );


  renderStories();


  showToast(
    "Story publiée 🔥"
  );
};


function renderStories() {

  const container =
    $("storiesList") ||
    document.querySelector(
      ".stories-list"
    );

  if (!container) return;

  container.innerHTML = "";


  stories.forEach(
    story => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "story-item";


      item.innerHTML = `

        <div class="story-ring">

          <div class="story-avatar">
            ${escapeHTML(
              getInitial(
                story.author
              )
            )}
          </div>

        </div>

        <small>
          ${escapeHTML(
            story.author
          )}
        </small>

      `;


      item.onclick = () => {

        if (
          story.type.startsWith(
            "video/"
          )
        ) {

          window.open(
            story.url,
            "_blank"
          );

        } else {

          window.open(
            story.url,
            "_blank"
          );
        }
      };


      container.appendChild(
        item
      );
    }
  );
}


// ============================================================
// FERMETURE MODALES
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const modal =
      $("modal");

    const authModal =
      $("authModal");


    if (modal) {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            closeModal();
          }
        }
      );
    }


    if (authModal) {

      authModal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            authModal
          ) {

            closeAuth();
          }
        }
      );
    }


    // Boutons retour automatiques

    document
      .querySelectorAll(
        "[data-back]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          goBack
        );
      });


    // Affichage initial

    renderPublications();

    renderStories();

    updateScore();
  }
);


// ============================================================
// CLAVIER
// ============================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeModal();

      closeAuth();
    }
  }
);


// ============================================================
// VISIBILITÉ VIDÉOS
// Lecture automatique lorsqu'une vidéo
// entre dans l'écran.
// ============================================================

const videoObserver =
  new IntersectionObserver(
    entries => {

      entries.forEach(
        entry => {

          const video =
            entry.target;

          if (
            !video ||
            !video.tagName
          ) {
            return;
          }


          if (
            entry.isIntersecting
          ) {

            // Le navigateur peut bloquer
            // l'autoplay avec son.

            video.muted = true;

            video.play()
              .catch(
                () => {}
              );

          } else {

            video.pause();
          }

        }
      );

    },
    {
      threshold: 0.65
    }
  );


function observeVideos() {

  document
    .querySelectorAll(
      "video"
    )
    .forEach(
      video => {

        try {

          videoObserver.observe(
            video
          );

        } catch (error) {

          console.log(error);
        }
      }
    );
}


setTimeout(
  observeVideos,
  500
);


// ============================================================
// CANVAS MATHÉMATIQUE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const canvas =
      $("mathCanvas");

    if (!canvas) return;

    const ctx =
      canvas.getContext(
        "2d"
      );

    let particles = [];


    function resizeCanvas() {

      canvas.width =
        window.innerWidth;

      canvas.height =
        window.innerHeight;

      particles = [];


      for (
        let i = 0;
        i < 70;
        i++
      ) {

        particles.push({

          x:
            Math.random() *
            canvas.width,

          y:
            Math.random() *
            canvas.height,

          vx:
            (Math.random() - .5)
            * .35,

          vy:
            (Math.random() - .5)
            * .35,

          r:
            Math.random() *
            2 +
            1

        });
      }
    }


    function drawMath() {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      particles.forEach(
        (p, i) => {

          p.x += p.vx;

          p.y += p.vy;


          if (
            p.x < 0 ||
            p.x >
            canvas.width
          ) {

            p.vx *= -1;
          }


          if (
            p.y < 0 ||
            p.y >
            canvas.height
          ) {

            p.vy *= -1;
          }


          ctx.beginPath();

          ctx.arc(
            p.x,
            p.y,
            p.r,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            "rgba(69,199,255,.65)";

          ctx.fill();


          for (
            let j = i + 1;
            j < particles.length;
            j++
          ) {

            const q =
              particles[j];

            const dx =
              p.x - q.x;

            const dy =
              p.y - q.y;

            const distance =
              Math.sqrt(
                dx * dx +
                dy * dy
              );


            if (
              distance < 130
            ) {

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
                "rgba(69,199,255," +
                (
                  .12 -
                  distance /
                  1300
                ) +
                ")";

              ctx.stroke();
            }
          }
        }
      );


      requestAnimationFrame(
        drawMath
      );
    }


    window.addEventListener(
      "resize",
      resizeCanvas
    );


    resizeCanvas();

    drawMath();
  }
);


// ============================================================
// FIN FISSA
// ============================================================

console.log(
  "🚀 FISSA est démarré."
);
