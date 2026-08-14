// ==========================================
// FISSA — APPLICATION
// AUTHENTIFICATION + VOTES + COMMENTAIRES
// ==========================================

import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "./firebase.js";


// ==========================================
// VARIABLES
// ==========================================

let likes = {
  A: 0,
  B: 0
};

let authMode = "login";

let toastTimer;


// ==========================================
// AUTHENTIFICATION
// ==========================================

window.openAuth = function(mode = "login") {

  authMode = mode;

  const modal =
    document.getElementById("authModal");

  const title =
    document.getElementById("authTitle");

  const name =
    document.getElementById("authName");

  const submit =
    document.getElementById("authSubmit");

  const switchButton =
    document.getElementById("switchAuth");


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


// ==========================================
// FERMER AUTH
// ==========================================

window.closeAuth = function() {

  const modal =
    document.getElementById("authModal");

  if (modal) {
    modal.classList.remove("show");
  }
};


// ==========================================
// CHANGER AUTH
// ==========================================

window.switchAuth = function() {

  if (authMode === "login") {

    openAuth("register");

  } else {

    openAuth("login");
  }
};


// ==========================================
// CRÉER COMPTE / CONNEXION
// ==========================================

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

    console.error(
      "Firebase:",
      error
    );

    showFirebaseError(error);
  }
};


// ==========================================
// DÉCONNEXION
// ==========================================

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


// ==========================================
// ÉTAT DE CONNEXION
// ==========================================

onAuthStateChanged(
  auth,
  function(user) {

    updateInterface(user);

  }
);


// ==========================================
// INTERFACE
// ==========================================

function updateInterface(user) {

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const userAvatar =
    document.getElementById(
      "userAvatar"
    );

  const profilePage =
    document.getElementById(
      "profilePage"
    );

  const profileName =
    document.getElementById(
      "profileName"
    );

  const profileEmail =
    document.getElementById(
      "profileEmail"
    );

  const profileUid =
    document.getElementById(
      "profileUid"
    );


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


    profileName.textContent =
      user.displayName ||
      "Utilisateur FISSA";


    profileEmail.textContent =
      user.email ||
      "";


    profileUid.textContent =
      "ID utilisateur : " +
      user.uid;


  } else {

    loginButton.classList.remove(
      "hidden"
    );

    userAvatar.classList.add(
      "hidden"
    );

    profilePage.classList.add(
      "hidden"
    );
  }
}


// ==========================================
// PROFIL
// ==========================================

window.openProfile = function() {

  const user =
    auth.currentUser;


  if (!user) {

    openAuth("login");

    return;
  }


  const profile =
    document.getElementById(
      "profilePage"
    );


  profile.classList.remove(
    "hidden"
  );


  profile.scrollIntoView({
    behavior: "smooth"
  });
};


// ==========================================
// ERREURS FIREBASE
// ==========================================

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


// ==========================================
// NETTOYER FORMULAIRE
// ==========================================

function clearAuthForm() {

  document.getElementById(
    "authName"
  ).value = "";

  document.getElementById(
    "authEmail"
  ).value = "";

  document.getElementById(
    "authPassword"
  ).value = "";
}


// ==========================================
// VOTE
// ==========================================

window.vote = function(side, button) {

  likes[side]++;


  document.getElementById(
    "likes" + side
  ).textContent =
    likes[side];


  button.classList.add(
    "active"
  );


  updateScore();


  showToast(
    "Ton vote pour " +
    side +
    " a été enregistré ❤️"
  );
};


// ==========================================
// SCORE
// ==========================================

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


  document.getElementById(
    "scoreA"
  ).style.width =
    percentA + "%";


  document.getElementById(
    "scoreB"
  ).style.width =
    percentB + "%";


  document.getElementById(
    "percentA"
  ).textContent =
    percentA + "%";


  document.getElementById(
    "percentB"
  ).textContent =
    percentB + "%";
}


// ==========================================
// IMAGE / VIDÉO
// ==========================================

window.loadMedia = function(
  event,
  side
) {

  const file =
    event.target.files[0];


  if (!file) return;


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


  image.style.display =
    "none";

  video.style.display =
    "none";


  if (
    file.type.startsWith("image/")
  ) {

    image.src =
      url;

    image.style.display =
      "block";


  } else if (
    file.type.startsWith("video/")
  ) {

    video.src =
      url;

    video.style.display =
      "block";
  }


  placeholder.style.display =
    "none";


  showToast(
    "Média " +
    side +
    " ajouté avec succès."
  );
};


// ==========================================
// COMMENTAIRE
// ==========================================

window.addComment = function(event) {

  event.preventDefault();


  const input =
    document.getElementById(
      "commentInput"
    );


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


  document
    .getElementById(
      "commentsList"
    )
    .prepend(comment);


  input.value = "";


  showToast(
    "Commentaire publié 💬"
  );
};


// ==========================================
// COMMENTER A / B
// ==========================================

window.commentFor = function(side) {

  const input =
    document.getElementById(
      "commentInput"
    );


  input.placeholder =
    "Ton avis sur la création " +
    side +
    "...";


  input.focus();


  scrollToComments();
};


// ==========================================
// PARTAGE
// ==========================================

window.sharePost = async function(
  side
) {

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

      await navigator.share(
        data
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


// ==========================================
// NAVIGATION
// ==========================================

window.scrollToComparison =
function() {

  const element =
    document.getElementById(
      "comparison"
    );


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


  element.scrollIntoView({
    behavior: "smooth"
  });
};


// ==========================================
// MODAL PUBLICATION
// ==========================================

window.openModal =
function() {

  document
    .getElementById(
      "modal"
    )
    .classList.add(
      "show"
    );
};


window.closeModal =
function() {

  document
    .getElementById(
      "modal"
    )
    .classList.remove(
      "show"
    );
};


window.publishComparison =
function() {

  const title =
    document.getElementById(
      "titleInput"
    );


  const value =
    title.value.trim();


  if (!value) {

    showToast(
      "Ajoute un titre avant de publier."
    );

    return;
  }


  closeModal();


  showToast(
    "Comparaison \"" +
    value +
    "\" créée 🚀"
  );
};


// ==========================================
// TOAST
// ==========================================

window.showToast =
function(message) {

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
      function() {

        toast.classList.remove(
          "show"
        );

      },
      2500
    );
};


// ==========================================
// MODALS — FERMETURE
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

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


    // ==========================
    // CANVAS MATHÉMATIQUE
    // ==========================

    const canvas =
      document.getElementById(
        "mathCanvas"
      );


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
);
