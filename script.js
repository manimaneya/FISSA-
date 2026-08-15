// ============================================================
// FISSA — SCRIPT PRINCIPAL
// Authentification + Votes + Commentaires + Médias
// Play vidéo + limite 60 secondes + Publication
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
// VARIABLES
// ============================================================

let likes = {
  A: 0,
  B: 0
};

let voted = {
  A: false,
  B: false
};

let authMode = "login";

let toastTimer = null;

const VIDEO_LIMIT = 60;


// ============================================================
// OUTILS
// ============================================================

function getElement(id) {
  return document.getElementById(id);
}


// ============================================================
// TOAST
// ============================================================

window.showToast = function(message) {

  const toast = getElement("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);
};


// ============================================================
// AUTHENTIFICATION
// ============================================================

window.openAuth = function(mode = "login") {

  authMode = mode;

  const modal = getElement("authModal");
  const title = getElement("authTitle");
  const name = getElement("authName");
  const submit = getElement("authSubmit");
  const switchButton = getElement("switchAuth");

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


// ============================================================
// FERMER AUTH
// ============================================================

window.closeAuth = function() {

  const modal = getElement("authModal");

  if (modal) {
    modal.classList.remove("show");
  }
};


// ============================================================
// CHANGER AUTH
// ============================================================

window.switchAuth = function() {

  if (authMode === "login") {

    openAuth("register");

  } else {

    openAuth("login");
  }
};


// ============================================================
// CONNEXION / INSCRIPTION
// ============================================================

window.submitAuth = async function() {

  const nameInput = getElement("authName");
  const emailInput = getElement("authEmail");
  const passwordInput = getElement("authPassword");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

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

    console.error("Firebase:", error);

    showFirebaseError(error);
  }
};


// ============================================================
// DÉCONNEXION
// ============================================================

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


// ============================================================
// ÉTAT UTILISATEUR
// ============================================================

onAuthStateChanged(
  auth,
  function(user) {

    updateInterface(user);

  }
);


// ============================================================
// INTERFACE UTILISATEUR
// ============================================================

function updateInterface(user) {

  const loginButton = getElement("loginButton");
  const userAvatar = getElement("userAvatar");

  const profilePage = getElement("profilePage");
  const profileName = getElement("profileName");
  const profileEmail = getElement("profileEmail");
  const profileUid = getElement("profileUid");

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


// ============================================================
// PROFIL
// ============================================================

window.openProfile = function() {

  const user = auth.currentUser;

  if (!user) {

    openAuth("login");

    return;
  }

  const profile = getElement("profilePage");

  if (!profile) return;

  profile.classList.remove("hidden");

  profile.scrollIntoView({
    behavior: "smooth"
  });
};


// ============================================================
// ERREURS FIREBASE
// ============================================================

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


// ============================================================
// NETTOYER FORMULAIRE AUTH
// ============================================================

function clearAuthForm() {

  const name = getElement("authName");
  const email = getElement("authEmail");
  const password = getElement("authPassword");

  if (name) name.value = "";
  if (email) email.value = "";
  if (password) password.value = "";
}


// ============================================================
// VOTE A / B
// ============================================================

window.vote = function(side, button) {

  if (side !== "A" && side !== "B") {
    return;
  }

  // Empêcher plusieurs votes sur le même côté
  if (voted[side]) {

    showToast(
      "Tu as déjà voté pour " + side + "."
    );

    return;
  }

  voted[side] = true;

  likes[side]++;

  const counter =
    getElement("likes" + side);

  if (counter) {

    counter.textContent =
      likes[side];
  }

  if (button) {

    button.classList.add("active");

    button.disabled = true;
  }

  updateScore();

  showToast(
    "Ton vote pour " +
    side +
    " a été enregistré ❤️"
  );
};


// ============================================================
// SCORE
// ============================================================

function updateScore() {

  const total =
    likes.A + likes.B;

  let percentA = 50;
  let percentB = 50;

  if (total > 0) {

    percentA =
      Math.round(
        (likes.A / total) * 100
      );

    percentB =
      100 - percentA;
  }

  const scoreA = getElement("scoreA");
  const scoreB = getElement("scoreB");

  const percentAElement =
    getElement("percentA");

  const percentBElement =
    getElement("percentB");

  if (scoreA) {

    scoreA.style.width =
      percentA + "%";
  }

  if (scoreB) {

    scoreB.style.width =
      percentB + "%";
  }

  if (percentAElement) {

    percentAElement.textContent =
      percentA + "%";
  }

  if (percentBElement) {

    percentBElement.textContent =
      percentB + "%";
  }
}


// ============================================================
// MÉDIA — IMAGE / VIDÉO
// ============================================================

window.loadMedia = function(event, side) {

  if (side !== "A" && side !== "B") {
    return;
  }

  const file =
    event.target.files[0];

  if (!file) return;

  const image =
    getElement("image" + side);

  const video =
    getElement("video" + side);

  const placeholder =
    getElement("placeholder" + side);

  if (!image || !video) return;

  const url =
    URL.createObjectURL(file);

  // Réinitialisation
  image.style.display = "none";

  video.style.display = "none";

  video.pause();

  video.currentTime = 0;

  if (file.type.startsWith("image/")) {

    image.src = url;

    image.style.display = "block";

    if (placeholder) {
      placeholder.style.display = "none";
    }

    showToast(
      "Image " +
      side +
      " ajoutée avec succès 🖼️"
    );

  }

  else if (file.type.startsWith("video/")) {

    video.src = url;

    video.muted = false;

    video.controls = true;

    video.playsInline = true;

    video.style.display = "block";

    if (placeholder) {
      placeholder.style.display = "none";
    }

    prepareVideo60Seconds(
      video,
      side
    );

    createPlayOverlay(
      video,
      side
    );

    showToast(
      "Vidéo " +
      side +
      " ajoutée — maximum 60 secondes 🎬"
    );

  }

  else {

    showToast(
      "Format de fichier non accepté."
    );
  }
};


// ============================================================
// VIDÉO — LIMITE 60 SECONDES
// ============================================================

function prepareVideo60Seconds(video, side) {

  video.addEventListener(
    "loadedmetadata",
    function() {

      if (video.duration > VIDEO_LIMIT) {

        showToast(
          "La vidéo " +
          side +
          " sera limitée à 60 secondes."
        );
      }

      updateVideoTime(video, side);
    },
    {
      once: true
    }
  );


  video.addEventListener(
    "timeupdate",
    function() {

      if (
        video.currentTime >= VIDEO_LIMIT
      ) {

        video.currentTime =
          VIDEO_LIMIT;

        video.pause();

        showToast(
          "Fin des 60 secondes de la vidéo " +
          side +
          " ⏱️"
        );
      }

      updateVideoTime(video, side);
    }
  );


  video.addEventListener(
    "play",
    function() {

      updatePlayButton(
        video,
        side
      );
    }
  );


  video.addEventListener(
    "pause",
    function() {

      updatePlayButton(
        video,
        side
      );
    }
  );
}


// ============================================================
// AFFICHAGE DU TEMPS
// ============================================================

function updateVideoTime(video, side) {

  const current =
    Math.min(
      video.currentTime || 0,
      VIDEO_LIMIT
    );

  const seconds =
    Math.floor(current);

  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  const formatted =
    minutes +
    ":" +
    String(remaining).padStart(2, "0");

  const timeElement =
    document.querySelector(
      ".video-time-" + side
    );

  if (timeElement) {

    timeElement.textContent =
      formatted +
      " / 1:00";
  }
}


// ============================================================
// BOUTON PLAY CENTRAL
// ============================================================

function createPlayOverlay(video, side) {

  const media =
    video.parentElement;

  if (!media) return;

  // Ne pas créer deux boutons
  const old =
    media.querySelector(
      ".fissa-play-" + side
    );

  if (old) {
    old.remove();
  }

  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "fissa-play-button fissa-play-" +
    side;

  button.setAttribute(
    "aria-label",
    "Lire la vidéo " + side
  );

  button.innerHTML =
    "▶";

  media.appendChild(button);


  // Temps vidéo
  const time =
    document.createElement("div");

  time.className =
    "video-time video-time-" +
    side;

  time.textContent =
    "0:00 / 1:00";

  media.appendChild(time);


  button.addEventListener(
    "click",
    function(event) {

      event.stopPropagation();

      if (video.paused) {

        const playPromise =
          video.play();

        if (
          playPromise &&
          typeof playPromise.catch === "function"
        ) {

          playPromise.catch(
            function(error) {

              console.log(
                "Lecture vidéo :",
                error
              );

              showToast(
                "Appuie encore sur ▶ pour lire la vidéo."
              );
            }
          );
        }

      } else {

        video.pause();
      }
    }
  );


  video.addEventListener(
    "click",
    function() {

      if (video.paused) {

        video.play().catch(
          () => {}
        );

      } else {

        video.pause();
      }
    }
  );
}


// ============================================================
// ANIMATION PLAY / PAUSE
// ============================================================

function updatePlayButton(video, side) {

  const media =
    video.parentElement;

  if (!media) return;

  const button =
    media.querySelector(
      ".fissa-play-" + side
    );

  if (!button) return;

  if (video.paused) {

    button.innerHTML = "▶";

    button.classList.remove(
      "playing"
    );

  } else {

    button.innerHTML = "❚❚";

    button.classList.add(
      "playing"
    );
  }
}


// ============================================================
// COMMENTAIRES
// ============================================================

window.addComment = function(event) {

  event.preventDefault();

  const input =
    getElement("commentInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  const comment =
    document.createElement("div");

  comment.className =
    "comment";

  const strong =
    document.createElement("strong");

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

  const commentsList =
    getElement("commentsList");

  if (commentsList) {

    commentsList.prepend(
      comment
    );
  }

  input.value = "";

  showToast(
    "Commentaire publié 💬"
  );
};


// ============================================================
// COMMENTER A / B
// ============================================================

window.commentFor = function(side) {

  const input =
    getElement("commentInput");

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

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Lien copié !"
      );
    }

  } catch (error) {

    console.log(
      "Partage annulé :",
      error
    );
  }
};


// ============================================================
// NAVIGATION COMPARAISON
// ============================================================

window.scrollToComparison =
function() {

  const element =
    getElement("comparison");

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ============================================================
// NAVIGATION COMMENTAIRES
// ============================================================

window.scrollToComments =
function() {

  const element =
    getElement("comments");

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ============================================================
// MODAL PUBLICATION
// ============================================================

window.openModal =
function() {

  const modal =
    getElement("modal");

  if (modal) {

    modal.classList.add("show");
  }
};


window.closeModal =
function() {

  const modal =
    getElement("modal");

  if (modal) {

    modal.classList.remove("show");
  }
};


// ============================================================
// PUBLICATION D'UNE COMPARAISON
// ============================================================

window.publishComparison =
function() {

  const titleInput =
    getElement("titleInput");

  const descriptionInput =
    getElement("descriptionInput");

  if (!titleInput) return;

  const title =
    titleInput.value.trim();

  const description =
    descriptionInput
      ? descriptionInput.value.trim()
      : "";

  if (!title) {

    showToast(
      "Ajoute un titre avant de publier."
    );

    return;
  }


  // Date de publication
  const date =
    new Date();


  const dateText =
    date.toLocaleString(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );


  const publication = {

    title: title,

    description: description,

    date: dateText,

    timestamp:
      Date.now(),

    author:
      auth.currentUser
        ? (
            auth.currentUser.displayName ||
            auth.currentUser.email
          )
        : "Visiteur"
  };


  // Sauvegarde locale
  localStorage.setItem(
    "fissa_last_publication",
    JSON.stringify(publication)
  );


  closeModal();


  titleInput.value = "";

  if (descriptionInput) {

    descriptionInput.value = "";
  }


  displayPublication(
    publication
  );


  showToast(
    "Comparaison publiée 🚀"
  );
};


// ============================================================
// AFFICHER LA PUBLICATION
// ============================================================

function displayPublication(publication) {

  if (!publication) return;


  const comparison =
    getElement("comparison");

  if (!comparison) return;


  let publicationBox =
    getElement("fissaPublication");


  if (!publicationBox) {

    publicationBox =
      document.createElement("div");

    publicationBox.id =
      "fissaPublication";

    publicationBox.className =
      "fissa-publication";


    comparison.parentNode.insertBefore(
      publicationBox,
      comparison
    );
  }


  publicationBox.innerHTML = "";


  const title =
    document.createElement("h2");

  title.textContent =
    "📌 " + publication.title;


  const description =
    document.createElement("p");

  description.textContent =
    publication.description ||
    "Nouvelle comparaison publiée sur FISSA.";


  const info =
    document.createElement("small");

  info.textContent =
    "Publié par " +
    publication.author +
    " • " +
    publication.date;


  publicationBox.appendChild(
    title
  );

  publicationBox.appendChild(
    description
  );

  publicationBox.appendChild(
    info
  );
}


// ============================================================
// CHARGER DERNIÈRE PUBLICATION
// ============================================================

function loadLastPublication() {

  try {

    const saved =
      localStorage.getItem(
        "fissa_last_publication"
      );

    if (!saved) return;

    const publication =
      JSON.parse(saved);

    displayPublication(
      publication
    );

  } catch (error) {

    console.log(
      "Publication locale :",
      error
    );
  }
}


// ============================================================
// FERMETURE DES MODALS
// ============================================================

function setupModalEvents() {

  const modal =
    getElement("modal");

  const authModal =
    getElement("authModal");


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


// ============================================================
// CANVAS MATHÉMATIQUE
// ============================================================

function startMathCanvas() {

  const canvas =
    getElement("mathCanvas");

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
          (Math.random() - 0.5)
          * 0.35,

        vy:
          (Math.random() - 0.5)
          * 0.35,

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
                0.12 -
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


// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    setupModalEvents();

    startMathCanvas();

    loadLastPublication();

    updateScore();

  }
);
