const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const messageEl = document.getElementById("message");
const captchaContainer = document.getElementById("captcha-container");

// משתנה למעקב אחרי נסיונות כושלים
let failedAttempts = 0;

// התחברות
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    messageEl.textContent = "אנא מלא/י אימייל וסיסמה";
    return;
  }

  // בדיקה: האם הגענו ל-5 נסיונות וצריך לבדוק קפצ'ה?
  if (failedAttempts >= 3) {
    const captchaResponse = grecaptcha.getResponse(); // פונקציה מובנית של גוגל
    if (captchaResponse.length === 0) {
      messageEl.style.color = "red";
      messageEl.textContent = "אנא אמת/י שאינך רובוט";
      return;
    }
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      messageEl.style.color = "green";
      messageEl.textContent = "התחברת בהצלחה!";
      // איפוס מונה במקרה של הצלחה
      failedAttempts = 0; 
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    })
    .catch(err => {
      failedAttempts++; // העלאת המונה בכל כישלון
      
      // הצגת הקפצ'ה אם הגענו ל-5 נסיונות
      if (failedAttempts >= 5) {
        captchaContainer.style.display = "block";
      }

      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה בהתחברות: " + err.message;
      
      // איפוס הקפצ'ה אם המשתמש נכשל שוב (כדי שיצטרך לסמן שוב)
      if (typeof grecaptcha !== 'undefined' && failedAttempts > 5) {
        grecaptcha.reset();
      }
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
        window.location.href = "dashboard.html";
      }, 800);
    })
    .catch(err => {
      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה ברישום: " + err.message;
    });
});

// אם כבר מחובר, כנס ישר לדשבורד
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});
