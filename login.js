// login.js

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const messageEl = document.getElementById("message");

// התחברות
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return messageEl.textContent = "אנא מלא/י אימייל וסיסמה";

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => messageEl.textContent = "שגיאה בהתחברות: " + err.message);
});

// רישום משתמש חדש
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return messageEl.textContent = "אנא מלא/י אימייל וסיסמה";

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => messageEl.textContent = "שגיאה ברישום: " + err.message);
});

// אם כבר מחובר
auth.onAuthStateChanged(user => { if (user) window.location.href = "dashboard.html"; });
