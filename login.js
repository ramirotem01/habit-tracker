const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const messageEl = document.getElementById("message");
const captchaContainer = document.getElementById("captcha-container");

let failedAttempts = 0;

// התחברות
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    messageEl.textContent = "אנא מלא/י אימייל וסיסמה";
    return;
  }

  if (failedAttempts >= 5) {
    const captchaResponse = grecaptcha.getResponse();
    if (captchaResponse.length === 0) {
      messageEl.textContent = "אנא אמת/י שאינך רובוט";
      return;
    }
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      messageEl.style.color = "green";
      messageEl.textContent = "התחברת בהצלחה!";
      window.location.href = "dashboard.html";
    })
    .catch(err => {
      failedAttempts++;
      if (failedAttempts >= 5) captchaContainer.style.display = "block";
      messageEl.style.color = "red";
      messageEl.textContent = "פרטים שגויים. נסה שוב.";
    });
});

// שכחתי סיסמה
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        messageEl.style.color = "red";
        messageEl.textContent = "הזן אימייל בשדה למעלה כדי לקבל קישור לאיפוס";
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = "אימייל לאיפוס נשלח! בדוק את תיבת הדואר.";
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = "שגיאה: " + err.message;
        });
});

auth.onAuthStateChanged(user => {
  if (user && (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"))) {
    window.location.href = "dashboard.html";
  }
});
