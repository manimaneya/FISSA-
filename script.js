// ======================================================
// FISSA — SCRIPT.JS COMPLET
// Compare • Vote • Vidéo • Story • Actualité • Partage
// ======================================================

import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "./firebase.js";


// ======================================================
// VARIABLES
// ======================================================

let likes = {
  A: 0,
  B: 0
};

let authMode = "login";
let toastTimer;

let currentFilter = "all";

let mediaData = {
  A: {
    type: null,
    url: null,
    isVideo: false,
    isPlaying: false,
    muted: false,
    duration: 0
  },

  B: {
    type: null,
    url: null,
    isVideo: false,
    isPlaying: false,
    muted: false,
    duration: 0
  }
};


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  initModals();
  initMathCanvas();
  initVideoControls();
  initFilters();

});


// ======================================================
// AUTHENTIFICATION
// ======================================================

window.openAuth = function(mode = "login") {

  authMode = mode;

  const modal = document.getElementById("authModal");
  const title = document.getElementById("authTitle");
  const name = document.getElementById("authName");
  const submit = document.getElementById("authSubmit");
  const switchButton = document.getElementById("switchAuth");

  if (!modal) return;

  modal.classList.add("show");

  if (mode === "register") {

    title.textContent = "Créer un compte FISSA";

    name.classList.remove("hidden");

    submit.textContent = "Créer mon compte";

    switchButton.textContent =
      "J'ai déjà un compte — Me connecter";

  } else {

    title.textContent = "Connexion FISSA";

    name.classList.add("hidden");

    submit.textContent = "Se connecter";

    switchButton.textContent =
      "Créer un nouveau compte";
  }
};


// ======================================================
// FERMER AUTH
// ======================================================

window.closeAuth = function() {

  const modal = document.getElementById("authModal");

  if (modal) {
    modal.classList.remove("show");
  }
};


// ======================================================
// CHANGER AUTH
// ======================================================

window.switchAuth = function() {

  if (authMode === "login") {

    openAuth("register");

  } else {

    openAuth("login");
  }
};


// ======================================================
// CONNEXION / INSCRIPTION
// ======================================================

window.submitAuth = async function() {

  const nameInput =
    document.getElementById("authName");

  const emailInput =
    document.getElementById("authEmail");

  const passwordInput =
    document.getElementById("authPassword");

  const name =
    nameInput.value.trim();

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

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
      "Le mot de passe doit avoir au moins 6 caractères."
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
        "Compte FISSA créé avec succès 🎉"
      );

      closeAuth();

      clearAuthForm();

    } else {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      showToast(
        "Connexion réussie ✅"
      );

      closeAuth();

      clearAuthForm();
    }

  } catch (error) {

    console.error("Firebase :", error);

    showFirebaseError(error);
  }
};


// ======================================================
// DÉCONNEXION
// ======================================================

window.logout = async function() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Erreur lors de la déconnexion."
    );
  }
};


// ======================================================
// ÉTAT FIREBASE
// ======================================================

onAuthStateChanged(
  auth,
  function(user) {

    updateInterface(user);

  }
);


// ======================================================
// INTERFACE UTILISATEUR
// ======================================================

function updateInterface(user) {

  const loginButton =
    document.getElementById("loginButton");

  const userAvatar =
    document.getElementById("userAvatar");

  const profilePage =
    document.getElementById("profilePage");

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

  const profileUid =
    document.getElementById("profileUid");

  if (!loginButton || !userAvatar) return;

  if (user) {

    loginButton.classList.add("hidden");

    userAvatar.classList.remove("hidden");

    const letter = (
      user.displayName ||
      user.email ||
      "U"
    )
      .charAt(0)
      .toUpperCase();

    userAvatar.textContent = letter;

    if (profileName) {

      profileName.textContent =
        user.displayName ||
        "Utilisateur FISSA";
    }

    if (profileEmail) {

      profileEmail.textContent =
        user.email || "";
    }

    if (profileUid) {

      profileUid.textContent =
        "ID utilisateur : " +
        user.uid;
    }

  } else {

    loginButton.classList.remove("hidden");

    userAvatar.classList.add("hidden");

    if (profilePage) {

      profilePage.classList.add("hidden");
    }
  }
}


// ======================================================
// PROFIL
// ======================================================

window.openProfile = function() {

  const user = auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const profile =
    document.getElementById("profilePage");

  if (!profile) return;

  profile.classList.remove("hidden");

  profile.scrollIntoView({
    behavior: "smooth"
  });
};


// ======================================================
// ERREURS FIREBASE
// ======================================================

function showFirebaseError(error) {

  let message =
    "Une erreur Firebase est survenue.";

  switch (error.code) {

    case "auth/email-already-in-use":
      message =
        "Cet e-mail possède déjà un compte.";
      break;

    case "auth/invalid-email":
      message =
        "Adresse e-mail invalide.";
      break;

    case "auth/weak-password":
      message =
        "Mot de passe trop faible.";
      break;

    case "auth/invalid-credential":
      message =
        "E-mail ou mot de passe incorrect.";
      break;

    case "auth/user-not-found":
      message =
        "Aucun compte avec cet e-mail.";
      break;

    case "auth/wrong-password":
      message =
        "Mot de passe incorrect.";
      break;

    case "auth/too-many-requests":
      message =
        "Trop de tentatives. Réessaie plus tard.";
      break;

    case "auth/network-request-failed":
      message =
        "Vérifie ta connexion Internet.";
      break;

    default:

      console.error(error);

      message =
        error.message ||
        "Erreur Firebase.";
  }

  showToast(message);
}


// ======================================================
// NETTOYER AUTH
// ======================================================

function clearAuthForm() {

  const name =
    document.getElementById("authName");

  const email =
    document.getElementById("authEmail");

  const password =
    document.getElementById("authPassword");

  if (name) name.value = "";

  if (email) email.value = "";

  if (password) password.value = "";
}


// ======================================================
// VOTE
// ======================================================

window.vote = function(side, button) {

  if (side !== "A" && side !== "B") return;

  likes[side]++;

  const counter =
    document.getElementById(
      "likes" + side
    );

  if (counter) {

    counter.textContent =
      likes[side];
  }

  if (button) {

    button.classList.add("active");

    button.disabled = true;
  }

  updateScore();

  animateVote(side);

  showToast(
    "Ton vote pour " +
    side +
    " a été enregistré ❤️"
  );
};


// ======================================================
// ANIMATION VOTE
// ======================================================

function animateVote(side) {

  const card =
    document.querySelector(
      `.contestant:nth-child(${
        side === "A" ? 1 : 3
      }) .media-card`
    );

  if (!card) return;

  card.classList.remove("vote-animation");

  void card.offsetWidth;

  card.classList.add("vote-animation");
}


// ======================================================
// SCORE
// ======================================================

function updateScore() {

  const total =
    likes.A + likes.B;

  let percentA = 50;
  let percentB = 50;

  if (total > 0) {

    percentA =
      Math.round(
        likes.A /
        total *
        100
      );

    percentB =
      100 - percentA;
  }

  const scoreA =
    document.getElementById("scoreA");

  const scoreB =
    document.getElementById("scoreB");

  const percentAEl =
    document.getElementById("percentA");

  const percentBEl =
    document.getElementById("percentB");

  if (scoreA)
    scoreA.style.width =
      percentA + "%";

  if (scoreB)
    scoreB.style.width =
      percentB + "%";

  if (percentAEl)
    percentAEl.textContent =
      percentA + "%";

  if (percentBEl)
    percentBEl.textContent =
      percentB + "%";
}


// ======================================================
// CHARGER IMAGE / VIDÉO
// ======================================================

window.loadMedia = function(event, side) {

  const file =
    event.target.files[0];

  if (!file) return;

  if (side !== "A" && side !== "B") return;

  const image =
    document.getElementById(
      "image" + side
    );

  const video =
    document.getElementById(
      "video" + side
    );

  const placeholder =
    document.getElementById(
      "placeholder" + side
    );

  const url =
    URL.createObjectURL(file);

  image.style.display = "none";

  video.style.display = "none";

  mediaData[side].url = url;

  mediaData[side].type =
    file.type;

  mediaData[side].isVideo =
    file.type.startsWith("video/");

  if (file.type.startsWith("image/")) {

    image.src = url;

    image.style.display = "block";

    showToast(
      "Image " +
      side +
      " ajoutée 🖼️"
    );

  } else if (
    file.type.startsWith("video/")
  ) {

    video.src = url;

    video.style.display = "block";

    prepareVideo(side);

    showToast(
      "Vidéo " +
      side +
      " ajoutée 🎬"
    );

  } else {

    showToast(
      "Format non supporté."
    );

    return;
  }

  if (placeholder) {

    placeholder.style.display =
      "none";
  }

  addMediaOverlay(side);
};


// ======================================================
// PRÉPARATION VIDÉO
// ======================================================

function prepareVideo(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  if (!video) return;

  video.removeAttribute("controls");

  video.setAttribute(
    "playsinline",
    ""
  );

  video.preload = "metadata";

  video.muted =
    mediaData[side].muted;

  video.addEventListener(
    "loadedmetadata",
    () => {

      mediaData[side].duration =
        video.duration;

      updateDuration(side);

    },
    {
      once: true
    }
  );

  video.addEventListener(
    "play",
    () => {

      mediaData[side].isPlaying =
        true;

      updatePlayButton(side);

    }
  );

  video.addEventListener(
    "pause",
    () => {

      mediaData[side].isPlaying =
        false;

      updatePlayButton(side);

    }
  );

  video.addEventListener(
    "ended",
    () => {

      mediaData[side].isPlaying =
        false;

      updatePlayButton(side);

    }
  );

  video.addEventListener(
    "timeupdate",
    () => {

      updateProgress(side);

    }
  );
}


// ======================================================
// AJOUT CONTRÔLES SUR MÉDIA
// ======================================================

function addMediaOverlay(side) {

  const media =
    document.querySelector(
      `#video${side}`
    );

  if (!media) return;

  const parent =
    media.parentElement;

  if (!parent) return;

  let controls =
    parent.querySelector(
      `.custom-controls-${side}`
    );

  if (controls) return;

  controls =
    document.createElement("div");

  controls.className =
    `custom-controls custom-controls-${side}`;

  controls.innerHTML = `

    <button
      type="button"
      class="media-control play-control"
      data-side="${side}"
      title="Lire / Pause"
    >
      ▶️
    </button>

    <button
      type="button"
      class="media-control sound-control"
      data-side="${side}"
      title="Son"
    >
      🔊
    </button>

    <button
      type="button"
      class="media-control vertical-control"
      data-side="${side}"
      title="Mode vertical"
    >
      📱
    </button>

    <div class="media-time">
      <span class="current-time">0:00</span>
      /
      <span class="duration">0:00</span>
    </div>

    <div class="media-progress">
      <div class="media-progress-fill"></div>
    </div>

  `;

  parent.appendChild(controls);

  const playButton =
    controls.querySelector(
      ".play-control"
    );

  const soundButton =
    controls.querySelector(
      ".sound-control"
    );

  const verticalButton =
    controls.querySelector(
      ".vertical-control"
    );

  playButton.addEventListener(
    "click",
    () => {

      togglePlay(side);

    }
  );

  soundButton.addEventListener(
    "click",
    () => {

      toggleSound(side);

    }
  );

  verticalButton.addEventListener(
    "click",
    () => {

      toggleVertical(side);

    }
  );

  updatePlayButton(side);
}


// ======================================================
// PLAY / PAUSE
// ======================================================

function togglePlay(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  if (!video) return;

  if (video.paused) {

    video.play()
      .then(() => {

        showToast(
          "Vidéo " +
          side +
          " ▶️"
        );

      })
      .catch(() => {

        showToast(
          "Appuie encore sur ▶️ pour lire la vidéo."
        );

      });

  } else {

    video.pause();

    showToast(
      "Vidéo " +
      side +
      " en pause ⏸️"
    );
  }
}


// ======================================================
// BOUTON PLAY
// ======================================================

function updatePlayButton(side) {

  const controls =
    document.querySelector(
      `.custom-controls-${side}`
    );

  if (!controls) return;

  const button =
    controls.querySelector(
      ".play-control"
    );

  if (!button) return;

  button.textContent =
    mediaData[side].isPlaying
      ? "⏸️"
      : "▶️";
}


// ======================================================
// SON
// ======================================================

function toggleSound(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  if (!video) return;

  video.muted =
    !video.muted;

  mediaData[side].muted =
    video.muted;

  const controls =
    document.querySelector(
      `.custom-controls-${side}`
    );

  if (!controls) return;

  const button =
    controls.querySelector(
      ".sound-control"
    );

  if (button) {

    button.textContent =
      video.muted
        ? "🔇"
        : "🔊";
  }

  showToast(
    video.muted
      ? "Son désactivé"
      : "Son activé 🔊"
  );
}


// ======================================================
// MODE VERTICAL
// ======================================================

function toggleVertical(side) {

  const media =
    document.querySelector(
      `#video${side}`
    );

  if (!media) return;

  const container =
    media.closest(".media");

  if (!container) return;

  container.classList.toggle(
    "vertical-mode"
  );

  const enabled =
    container.classList.contains(
      "vertical-mode"
    );

  showToast(
    enabled
      ? "Mode vertical 📱 activé"
      : "Mode normal activé"
  );
}


// ======================================================
// TEMPS VIDÉO
// ======================================================

function updateProgress(side) {

  const video =
    document.getElementById(
      "video" + side
    );

  const controls =
    document.querySelector(
      `.custom-controls-${side}`
    );

  if (!video || !controls) return;

  const current =
    controls.querySelector(
      ".current-time"
    );

  const progress =
    controls.querySelector(
      ".media-progress-fill"
    );

  if (current) {

    current.textContent =
      formatTime(video.currentTime);
  }

  if (
    progress &&
    video.duration
  ) {

    progress.style.width =
      (
        video.currentTime /
        video.duration *
        100
      ) + "%";
  }
}


// ======================================================
// DURÉE
// ======================================================

function updateDuration(side) {

  const controls =
    document.querySelector(
      `.custom-controls-${side}`
    );

  if (!controls) return;

  const duration =
    controls.querySelector(
      ".duration"
    );

  if (duration) {

    duration.textContent =
      formatTime(
        mediaData[side].duration
      );
  }
}


// ======================================================
// FORMAT TEMPS
// ======================================================

function formatTime(seconds) {

  if (!seconds || isNaN(seconds)) {

    return "0:00";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const remaining =
    Math.floor(
      seconds % 60
    );

  return (
    minutes +
    ":" +
    String(remaining).padStart(2, "0")
  );
}


// ======================================================
// BARRE DE PROGRESSION CLIQUABLE
// ======================================================

document.addEventListener(
  "click",
  function(event) {

    const progress =
      event.target.closest(
        ".media-progress"
      );

    if (!progress) return;

    const side =
      progress
        .closest(".media")
        ?.querySelector("video")
        ?.id
        ?.replace("video", "");

    if (!side) return;

    const video =
      document.getElementById(
        "video" + side
      );

    if (!video || !video.duration) return;

    const rect =
      progress.getBoundingClientRect();

    const position =
      (event.clientX - rect.left) /
      rect.width;

    video.currentTime =
      position *
      video.duration;
  }
);


// ======================================================
// COMMENTAIRES
// ======================================================

window.addComment = function(event) {

  event.preventDefault();

  const input =
    document.getElementById(
      "commentInput"
    );

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

  const user =
    auth.currentUser;

  strong.textContent =
    user
      ? (
          user.displayName ||
          user.email
        )
      : "Visiteur";

  comment.appendChild(
    strong
  );

  comment.appendChild(
    document.createTextNode(
      " " + text
    )
  );

  const list =
    document.getElementById(
      "commentsList"
    );

  if (list) {

    list.prepend(comment);
  }

  input.value = "";

  showToast(
    "Commentaire publié 💬"
  );
};


// ======================================================
// COMMENTER A / B
// ======================================================

window.commentFor = function(side) {

  const input =
    document.getElementById(
      "commentInput"
    );

  if (!input) return;

  input.placeholder =
    "Ton avis sur la création " +
    side +
    "...";

  input.focus();

  scrollToComments();
};


// ======================================================
// PARTAGE
// ======================================================

window.sharePost = async function(side) {

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

    if (navigator.share) {

      await navigator.share(data);

      showToast(
        "Partage effectué ↗"
      );

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié !"
      );
    }

  } catch (error) {

    console.log(error);
  }
};


// ======================================================
// NAVIGATION
// ======================================================

window.scrollToComparison =
function() {

  const element =
    document.getElementById(
      "comparison"
    );

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


window.scrollToComments =
function() {

  const element =
    document.getElementById(
      "comments"
    );

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ======================================================
// FILTRES FISSA
// ======================================================

function initFilters() {

  document.addEventListener(
    "click",
    function(event) {

      const button =
        event.target.closest(
          "[data-filter]"
        );

      if (!button) return;

      const filter =
        button.dataset.filter;

      applyFilter(filter);

    }
  );
}


window.applyFilter =
function(filter) {

  currentFilter =
    filter;

  const cards =
    document.querySelectorAll(
      ".contestant"
    );

  cards.forEach(
    card => {

      card.style.display =
        "";
    }
  );

  document
    .querySelectorAll(
      "[data-filter]"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.filter === filter
        );
      }
    );

  if (filter === "A") {

    showOnlySide("A");

    showToast(
      "Actualité A 🔵"
    );

  } else if (filter === "B") {

    showOnlySide("B");

    showToast(
      "Actualité B 🔴"
    );

  } else if (filter === "story") {

    showStories();

    showToast(
      "Mode Story 📖"
    );

  } else {

    showAllSides();

    showToast(
      "Toutes les publications"
    );
  }
};


// ======================================================
// AFFICHER A SEUL
// ======================================================

function showOnlySide(side) {

  const contestants =
    document.querySelectorAll(
      ".contestant"
    );

  contestants.forEach(
    (item, index) => {

      if (side === "A") {

        item.style.display =
          index === 0
            ? ""
            : "none";

      } else {

        item.style.display =
          index === 1
            ? ""
            : "none";
      }
    }
  );

  const vs =
    document.querySelector(
      ".vs"
    );

  if (vs) {

    vs.style.display =
      "none";
  }
}


// ======================================================
// TOUT AFFICHER
// ======================================================

function showAllSides() {

  document
    .querySelectorAll(
      ".contestant"
    )
    .forEach(
      item => {

        item.style.display =
          "";
      }
    );

  const vs =
    document.querySelector(
      ".vs"
    );

  if (vs) {

    vs.style.display =
      "";
  }
}


// ======================================================
// MODE STORY
// ======================================================

function showStories() {

  showAllSides();

  const comparison =
    document.getElementById(
      "comparison"
    );

  if (!comparison) return;

  comparison.classList.add(
    "story-mode"
  );

  setTimeout(
    () => {

      comparison.classList.remove(
        "story-mode"
      );

    },
    3000
  );
}


// ======================================================
// MODAL PUBLICATION
// ======================================================

window.openModal =
function() {

  const modal =
    document.getElementById(
      "modal"
    );

  if (modal) {

    modal.classList.add(
      "show"
    );
  }
};


window.closeModal =
function() {

  const modal =
    document.getElementById(
      "modal"
    );

  if (modal) {

    modal.classList.remove(
      "show"
    );
  }
};


// ======================================================
// PUBLICATION
// ======================================================

window.publishComparison =
function() {

  const title =
    document.getElementById(
      "titleInput"
    );

  const description =
    document.getElementById(
      "descriptionInput"
    );

  const value =
    title
      ? title.value.trim()
      : "";

  const desc =
    description
      ? description.value.trim()
      : "";

  if (!value) {

    showToast(
      "Ajoute un titre avant de publier."
    );

    return;
  }

  closeModal();

  createPublicationCard(
    value,
    desc
  );

  if (title)
    title.value = "";

  if (description)
    description.value = "";

  showToast(
    "Comparaison \"" +
    value +
    "\" publiée 🚀"
  );
};


// ======================================================
// CRÉATION D'UNE PUBLICATION
// ======================================================

function createPublicationCard(
  title,
  description
) {

  const comparison =
    document.getElementById(
      "comparison"
    );

  if (!comparison) return;

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "fissa-publication";

  card.innerHTML = `

    <div class="publication-badge">
      🆕 NOUVELLE PUBLICATION
    </div>

    <h3>
      ${escapeHTML(title)}
    </h3>

    <p>
      ${escapeHTML(
        description ||
        "Nouvelle comparaison FISSA."
      )}
    </p>

    <div class="publication-info">

      <span>
        🔵 A
      </span>

      <strong>
        VS
      </strong>

      <span>
        🔴 B
      </span>

    </div>

    <button
      type="button"
      onclick="scrollToComparison()"
    >
      Voir la comparaison →
    </button>

  `;

  comparison.parentNode.insertBefore(
    card,
    comparison
  );

  card.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


// ======================================================
// PROTECTION HTML
// ======================================================

function escapeHTML(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// TOAST
// ======================================================

window.showToast =
function(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) return;

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
      function() {

        toast.classList.remove(
          "show"
        );

      },
      2500
    );
};


// ======================================================
// MODALS
// ======================================================

function initModals() {

  const modal =
    document.getElementById(
      "modal"
    );

  const authModal =
    document.getElementById(
      "authModal"
    );

  if (modal) {

    modal.addEventListener(
      "click",
      function(event) {

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
      function(event) {

        if (
          event.target === authModal
        ) {

          closeAuth();
        }
      }
    );
  }
}


// ======================================================
// CANVAS MATHÉMATIQUE
// ======================================================

function initMathCanvas() {

  const canvas =
    document.getElementById(
      "mathCanvas"
    );

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

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
          Math.random() * 2 + 1
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
      function(p, i) {

        p.x += p.vx;

        p.y += p.vy;

        if (
          p.x < 0 ||
          p.x > canvas.width
        ) {

          p.vx *= -1;
        }

        if (
          p.y < 0 ||
          p.y > canvas.height
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
                distance / 1300
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


// ======================================================
// INITIALISATION DES CONTRÔLES VIDÉO
// ======================================================

function initVideoControls() {

  ["A", "B"].forEach(
    side => {

      const video =
        document.getElementById(
          "video" + side
        );

      if (!video) return;

      video.addEventListener(
        "loadedmetadata",
        () => {

          mediaData[side].duration =
            video.duration;

          addMediaOverlay(side);

          updateDuration(side);
        }
      );
    }
  );
}


// ======================================================
// RACCOURCI CLAVIER
// ======================================================

document.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Escape") {

      closeModal();

      closeAuth();
    }
  }
);


// ======================================================
// FIN SCRIPT FISSA
// ======================================================
