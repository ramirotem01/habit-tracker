function signup() {
  const email = emailInput();
  const password = passwordInput();

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      const uid = userCred.user.uid;

      return db.collection("users").doc(uid).set({
        allHabits: [],
        dailyStats: {}
      });
    })
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

function login() {
  const email = emailInput();
  const password = passwordInput();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

function emailInput() {
  return document.getElementById("email").value;
}

function passwordInput() {
  return document.getElementById("password").value;
}

// אם כבר מחובר → לדשבורד
auth.onAuthStateChanged(user => {
  if (user && location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }
});
