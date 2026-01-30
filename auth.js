function register() {
  const email = email.value;
  const password = password.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

function login() {
  const email = email.value;
  const password = password.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}
