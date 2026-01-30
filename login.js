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

  if (!email || !password) {
    messageEl.textContent = "אנא מלא/י אימייל וסיסמה";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      messageEl.style.color = "green";
      messageEl.textContent = "התחברת בהצלחה!";
      setTimeout(() => {
        window.location.href = "index.html"; // מעבר לדשבורד
      }, 800);
    })
    .catch(err => {
      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה בהתחברות: " + err.message;
    });
});

// רישום משתמש חדש
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    messageEl.textContent = "אנא מלא/י אימייל וסיסמה";
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      messageEl.style.color = "green";
      messageEl.textContent = "נוצר משתמש חדש בהצלחה!";
      setTimeout(() => {
        window.location.href = "index.html"; // מעבר לדשבורד
      }, 800);
    })
    .catch(err => {
      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה ברישום: " + err.message;
    });
});

// בדיקה אם כבר מחובר
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = "index.html"; // כבר מחובר, כנס ישר לדשבורד
  }
});
