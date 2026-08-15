// ======================================================
// FISSA — SCRIPT.JS
// Système social : Actualité + Story + Comparaison A/B
// Firebase Auth + Publications + Profil + AI FISSA
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

let authMode = "login";
let toastTimer = null;

let likes = {
  A: 0,
  B: 0
};

let currentFilter = "actualite";

let publications = [];

let stories = [];


// ======================================================
// UTILITAIRES
// ======================================================

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text || "";

  return div.innerHTML;
}


// ======================================================
// TOAST
// ======================================================

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


// ======================================================
// AUTHENTIFICATION
// ======================================================

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

    title.textContent =
      "Créer un compte FISSA";

    name.classList.remove("hidden");

    submit.textContent =
      "Créer mon compte";

    switchButton.textContent =
      "J'ai déjà un compte — Me connecter";

  } else {

    title.textContent =
      "Connexion FISSA";

    name.classList.add("hidden");

    submit.textContent =
      "Se connecter";

    switchButton.textContent =
      "Créer un nouveau compte";
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


// ======================================================
// INSCRIPTION / CONNEXION
// ======================================================

window.submitAuth = async function() {

  const nameInput = $("authName");
  const emailInput = $("authEmail");
  const passwordInput = $("authPassword");

  if (!emailInput || !passwordInput) return;

  const name =
    nameInput.value.trim();

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  if (!email) {

    showToast(
      "Entre ton adresse e-mail."
    );

    return;
  }

  if (!password) {

    showToast(
      "Entre ton mot de passe."
    );

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
        "Compte FISSA créé 🎉"
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

    console.error(
      "Firebase Auth:",
      error
    );

    showFirebaseError(error);

  }
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

  if ($("authName"))
    $("authName").value = "";

  if ($("authEmail"))
    $("authEmail").value = "";

  if ($("authPassword"))
    $("authPassword").value = "";
}


// ======================================================
// DÉCONNEXION
// ======================================================

window.logout = async function() {

  try {

    await signOut(auth);

    showToast(
      "Déconnexion réussie."
    );

    showPage("home");

  } catch (error) {

    console.error(error);

    showToast(
      "Erreur lors de la déconnexion."
    );
  }
};


// ======================================================
// ÉTAT UTILISATEUR
// ======================================================

onAuthStateChanged(
  auth,
  user => {

    updateInterface(user);

  }
);


function updateInterface(user) {

  const loginButton =
    $("loginButton");

  const userAvatar =
    $("userAvatar");

  if (!loginButton || !userAvatar)
    return;


  if (user) {

    loginButton.classList.add(
      "hidden"
    );

    userAvatar.classList.remove(
      "hidden"
    );


    const letter = (
      user.displayName ||
      user.email ||
      "U"
    )
      .charAt(0)
      .toUpperCase();


    userAvatar.textContent =
      letter;


    if ($("profileName")) {

      $("profileName").textContent =
        user.displayName ||
        "Utilisateur FISSA";

    }


    if ($("profileEmail")) {

      $("profileEmail").textContent =
        user.email || "";

    }


    if ($("profileUid")) {

      $("profileUid").textContent =
        "ID utilisateur : " +
        user.uid;

    }

  } else {

    loginButton.classList.remove(
      "hidden"
    );

    userAvatar.classList.add(
      "hidden"
    );

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

  showPage("profile");

};


window.updateProfilePhoto =
function(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    showToast(
      "Choisis une image."
    );

    return;
  }

  const url =
    URL.createObjectURL(file);

  const avatar =
    $("profilePhoto");

  if (avatar) {

    avatar.src = url;

    avatar.classList.remove(
      "hidden"
    );

  }

  showToast(
    "Photo de profil ajoutée 📸"
  );
};


// ======================================================
// NAVIGATION DES PAGES
// ======================================================

function showPage(page) {

  const sections =
    document.querySelectorAll(
      "[data-page]"
    );

  sections.forEach(section => {

    section.classList.add(
      "hidden"
    );

  });


  const target =
    document.querySelector(
      `[data-page="${page}"]`
    );

  if (target) {

    target.classList.remove(
      "hidden"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
}


window.goBack = function() {

  showPage("home");

};


window.showHome = function() {

  showPage("home");

};


window.showProfile = function() {

  openProfile();

};


// ======================================================
// FILTRES
// ======================================================

window.setFeedFilter =
function(filter) {

  currentFilter =
    filter;

  document
    .querySelectorAll(
      ".feed-filter"
    )
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });


  const active =
    document.querySelector(
      `[data-filter="${filter}"]`
    );

  if (active) {

    active.classList.add(
      "active"
    );

  }


  renderFeed();

  showToast(
    filter === "story"
      ? "Stories sélectionnées"
      : "Actualités sélectionnées"
  );
};


// ======================================================
// PUBLICATION
// ======================================================

window.openModal = function() {

  const modal = $("modal");

  if (!modal) return;

  modal.classList.add("show");

};


window.closeModal = function() {

  const modal = $("modal");

  if (modal) {

    modal.classList.remove(
      "show"
    );

  }
};


// ======================================================
// CRÉER UNE PUBLICATION
// ======================================================

window.publishComparison =
function() {

  const titleInput =
    $("titleInput");

  const descriptionInput =
    $("descriptionInput");

  const title =
    titleInput
      ? titleInput.value.trim()
      : "";

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


  const user =
    auth.currentUser;


  const publication = {

    id:
      "post-" +
      Date.now(),

    title,

    description,

    author:
      user
        ? (
            user.displayName ||
            user.email
          )
        : "Visiteur FISSA",

    authorEmail:
      user
        ? user.email
        : "",

    type:
      "actualite",

    createdAt:
      new Date().toISOString(),

    likes: 0

  };


  publications.unshift(
    publication
  );


  savePublications();

  closeModal();

  if (titleInput)
    titleInput.value = "";

  if (descriptionInput)
    descriptionInput.value = "";


  currentFilter =
    "actualite";

  renderFeed();


  showToast(
    "Publication ajoutée à l'actualité 🚀"
  );


  setTimeout(() => {

    const feed =
      $("feed");

    if (feed) {

      feed.scrollIntoView({
        behavior: "smooth"
      });

    }

  }, 300);
};


// ======================================================
// SAUVEGARDE LOCALE DES PUBLICATIONS
// ======================================================

function savePublications() {

  try {

    localStorage.setItem(
      "fissa_publications",
      JSON.stringify(
        publications
      )
    );

  } catch (error) {

    console.error(error);

  }
}


function loadPublications() {

  try {

    const saved =
      localStorage.getItem(
        "fissa_publications"
      );

    if (saved) {

      publications =
        JSON.parse(saved);

    }

  } catch (error) {

    console.error(error);

    publications = [];

  }
}


// ======================================================
// FIL D'ACTUALITÉ
// ======================================================

function renderFeed() {

  const feed =
    $("feed");

  if (!feed) return;


  feed.innerHTML = "";


  let data = [];


  if (currentFilter === "story") {

    data = stories;

  } else {

    data = publications;

  }


  if (!data.length) {

    feed.innerHTML = `

      <div class="empty-feed">

        <div class="empty-icon">
          ✨
        </div>

        <h3>
          Rien à afficher pour le moment
        </h3>

        <p>
          Publie une comparaison pour
          commencer le fil FISSA.
        </p>

      </div>

    `;

    return;
  }


  data.forEach(
    publication => {

      feed.appendChild(
        createPublicationCard(
          publication
        )
      );

    }
  );
}


// ======================================================
// CARTE PUBLICATION
// ======================================================

function createPublicationCard(
  post
) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "feed-post";


  const isAI =
    post.author ===
    "FISSA AI";


  article.innerHTML = `

    <div class="feed-post-head">

      <div class="post-author">

        <div class="post-avatar ${
          isAI ? "ai-avatar" : ""
        }">

          ${
            isAI
              ? "🤖"
              : escapeHTML(
                  (post.author || "U")
                    .charAt(0)
                    .toUpperCase()
                )
          }

        </div>

        <div>

          <strong>
            ${escapeHTML(
              post.author ||
              "Utilisateur FISSA"
            )}
          </strong>

          <small>
            ${formatDate(
              post.createdAt
            )}
          </small>

        </div>

      </div>

      <span class="post-badge">
        ${post.type === "story"
          ? "STORY"
          : "ACTUALITÉ"}
      </span>

    </div>


    <div class="post-body">

      <h3>
        ${escapeHTML(
          post.title
        )}
      </h3>

      <p>
        ${escapeHTML(
          post.description ||
          "Nouvelle publication FISSA."
        )}
      </p>

    </div>


    <div class="post-actions">

      <button
        type="button"
        onclick="likePublication('${post.id}')"
      >
        ❤️
        ${post.likes || 0}
      </button>

      <button
        type="button"
        onclick="sharePublication('${post.id}')"
      >
        ↗ Partager
      </button>

    </div>

  `;


  return article;
}


// ======================================================
// LIKE PUBLICATION
// ======================================================

window.likePublication =
function(id) {

  const post =
    publications.find(
      item => item.id === id
    );

  if (!post) return;

  post.likes =
    (post.likes || 0) + 1;

  savePublications();

  renderFeed();

  showToast(
    "J'aime ajouté ❤️"
  );
};


// ======================================================
// PARTAGE PUBLICATION
// ======================================================

window.sharePublication =
async function(id) {

  const post =
    publications.find(
      item => item.id === id
    );

  if (!post) return;


  const data = {

    title:
      "FISSA — " +
      post.title,

    text:
      post.description ||
      "Découvre cette publication FISSA.",

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


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

  if (!date)
    return "maintenant";

  const d =
    new Date(date);

  return d.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


// ======================================================
// VOTE A / B
// ======================================================

window.vote =
function(side, button) {

  if (
    side !== "A" &&
    side !== "B"
  ) return;


  likes[side]++;


  const counter =
    $("likes" + side);

  if (counter) {

    counter.textContent =
      likes[side];

  }


  if (button) {

    button.classList.add(
      "active"
    );

  }


  updateScore();


  showToast(
    "Vote pour " +
    side +
    " enregistré ❤️"
  );
};


function updateScore() {

  const total =
    likes.A +
    likes.B;


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
      100 -
      percentA;

  }


  if ($("scoreA"))
    $("scoreA").style.width =
      percentA + "%";


  if ($("scoreB"))
    $("scoreB").style.width =
      percentB + "%";


  if ($("percentA"))
    $("percentA").textContent =
      percentA + "%";


  if ($("percentB"))
    $("percentB").textContent =
      percentB + "%";

}


// ======================================================
// MÉDIA IMAGE / VIDÉO
// ======================================================

window.loadMedia =
function(event, side) {

  const file =
    event.target.files[0];

  if (!file) return;


  const image =
    $("image" + side);

  const video =
    $("video" + side);

  const placeholder =
    $("placeholder" + side);


  const url =
    URL.createObjectURL(file);


  if (image)
    image.style.display =
      "none";


  if (video) {

    video.style.display =
      "none";

    video.pause();

  }


  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    if (image) {

      image.src = url;

      image.style.display =
        "block";

    }

  }


  else if (
    file.type.startsWith(
      "video/"
    )
  ) {

    if (video) {

      video.src = url;

      video.style.display =
        "block";

      video.controls = true;

      video.preload = "metadata";

      addVideoControls(
        video,
        side
      );

    }

  }


  if (placeholder) {

    placeholder.style.display =
      "none";

  }


  showToast(
    "Média " +
    side +
    " ajouté 🎬"
  );
};


// ======================================================
// CONTRÔLES VIDÉO
// PLAY + SON + LIMITE 60 SEC
// ======================================================

function addVideoControls(
  video,
  side
) {

  video.addEventListener(
    "timeupdate",
    function() {

      if (
        video.currentTime >= 60
      ) {

        video.pause();

        video.currentTime =
          60;

        showToast(
          "Vidéo limitée à 60 secondes ⏱️"
        );

      }

    }
  );


  video.addEventListener(
    "play",
    function() {

      showToast(
        "Lecture " +
        side +
        " ▶️"
      );

    }
  );


  video.addEventListener(
    "volumechange",
    function() {

      if (
        video.muted
      ) {

        showToast(
          "Son coupé 🔇"
        );

      } else {

        showToast(
          "Son activé 🔊"
        );

      }

    }
  );
}


// ======================================================
// BOUTON PLAY EXTERNE
// ======================================================

window.toggleVideo =
function(side) {

  const video =
    $("video" + side);

  if (!video) return;


  if (
    video.paused
  ) {

    video.play();

  } else {

    video.pause();

  }
};


// ======================================================
// BOUTON SON
// ======================================================

window.toggleSound =
function(side) {

  const video =
    $("video" + side);

  if (!video) return;


  video.muted =
    !video.muted;


  showToast(
    video.muted
      ? "Son désactivé 🔇"
      : "Son activé 🔊"
  );
};


// ======================================================
// COMMENTAIRES
// ======================================================

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


  const user =
    auth.currentUser;


  const name =
    user
      ? (
          user.displayName ||
          user.email
        )
      : "Visiteur";


  const strong =
    document.createElement(
      "strong"
    );


  strong.textContent =
    name;


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

    list.prepend(
      comment
    );

  }


  input.value = "";


  showToast(
    "Commentaire publié 💬"
  );
};


// ======================================================
// COMMENTER A / B
// ======================================================

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


// ======================================================
// PARTAGE A / B
// ======================================================

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


// ======================================================
// NAVIGATION COMPARAISON
// ======================================================

window.scrollToComparison =
function() {

  const element =
    $("comparison");

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


window.scrollToComments =
function() {

  const element =
    $("comments");

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ======================================================
// FISSA AI — UTILISATEUR AUTOMATIQUE
// ======================================================

function createFISSAAI() {

  const exists =
    publications.some(
      post =>
        post.author ===
        "FISSA AI"
    );

  if (exists) return;


  const aiPost = {

    id:
      "fissa-ai-" +
      Date.now(),

    title:
      "Bienvenue sur FISSA 🌍",

    description:
      "FISSA AI vous présente les nouvelles créations. Comparez A et B, votez, commentez et partagez avec la communauté.",

    author:
      "FISSA AI",

    authorEmail:
      "ai@fissa.app",

    type:
      "actualite",

    createdAt:
      new Date().toISOString(),

    likes:
      0

  };


  publications.unshift(
    aiPost
  );


  savePublications();

}


// ======================================================
// STORY
// ======================================================

function createDefaultStory() {

  if (stories.length)
    return;


  stories.push({

    id:
      "story-fissa",

    title:
      "FISSA Story",

    description:
      "Découvrez les nouveautés FISSA.",

    author:
      "FISSA AI",

    type:
      "story",

    createdAt:
      new Date().toISOString(),

    likes:
      0

  });

}


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadPublications();

    createFISSAAI();

    createDefaultStory();

    renderFeed();


    // ------------------------------------------
    // Fermeture modal publication
    // ------------------------------------------

    const modal =
      $("modal");


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


    // ------------------------------------------
    // Fermeture modal authentification
    // ------------------------------------------

    const authModal =
      $("authModal");


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


    // ------------------------------------------
    // Canvas mathématique
    // ------------------------------------------

    initMathCanvas();

  }
);


// ======================================================
// CANVAS MATHÉMATIQUE
// ======================================================

function initMathCanvas() {

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
          Math.random() *
          2 + 1

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
// RACCOURCI ESCAPE
// ======================================================

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
