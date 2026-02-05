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
    messageEl.style.color = "red";
    messageEl.textContent = "אנא מלא/י אימייל וסיסמה";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      messageEl.style.color = "green";
      messageEl.textContent = "התחברת בהצלחה!";
      setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
    })
    .catch(err => {
      failedAttempts++;
      if (failedAttempts >= 5) captchaContainer.style.display = "block";
      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה בהתחברות: פרטים שגויים";
    });
});

// מנגנון שכחתי סיסמה
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    
    if (!email) {
        messageEl.style.color = "red";
        messageEl.textContent = "כדי לאפס סיסמה, הזן קודם את כתובת המייל שלך בשדה למעלה.";
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = "איפוס סיסמה נשלח בהצלחה למייל! בדוק את תיבת הדואר (וגם את הספאם).";
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = "שגיאה בשליחת האיפוס: " + err.message;
        });
});

auth.onAuthStateChanged(user => {
  if (user && (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"))) {
    window.location.href = "dashboard.html";
  }
});
