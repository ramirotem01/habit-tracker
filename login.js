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

  // בדיקת קפצ'ה אחרי 5 כשלונות
  if (failedAttempts >= 5) {
    const captchaResponse = grecaptcha.getResponse();
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
      failedAttempts = 0; 
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    })
    .catch(err => {
      failedAttempts++;
      if (failedAttempts >= 5) {
        captchaContainer.style.display = "block";
      }
      messageEl.style.color = "red";
      messageEl.textContent = "שגיאה בהתחברות: פרטים שגויים";
      
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

// בדיקה אם המשתמש כבר מחובר
auth.onAuthStateChanged(user => {
  if (user) {
    // אם המשתמש מחובר ונמצא בדף הכניסה, העבר אותו לדשבורד
    if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {
       window.location.href = "dashboard.html";
    }
  }
});
