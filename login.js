// קישור לאלמנטים מה-HTML
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const messageEl = document.getElementById("message");
const captchaContainer = document.getElementById("captcha-container");

let failedAttempts = 0;

// --- מנגנון התחברות ---
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
            messageEl.textContent = "התחברת בהצלחה! מעביר לדאשבורד...";
            setTimeout(() => { 
                window.location.href = "dashboard.html"; 
            }, 800);
        })
        .catch(err => {
            console.error("Login Error:", err.code, err.message);
            failedAttempts++;
            
            // הצגת קאפצ'ה אחרי 5 נסיונות כושלים
            if (failedAttempts >= 5) {
                captchaContainer.style.display = "block";
            }

            messageEl.style.color = "red";
            // טיפול בשגיאות נפוצות
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                messageEl.textContent = "אימייל או סיסמה שגויים";
            } else if (err.code === "auth/too-many-requests") {
                messageEl.textContent = "יותר מדי נסיונות כושלים. החשבון ננעל זמנית.";
            } else {
                messageEl.textContent = "שגיאה בהתחברות: " + err.message;
            }
        });
});

// --- מנגנון שכחתי סיסמה ---
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault(); // מניעת רענון הדף
    
    const email = emailInput.value.trim();
    
    // בדיקה שהמשתמש הזין מייל לפני הלחיצה
    if (!email) {
        messageEl.style.color = "red";
        messageEl.textContent = "כדי לאפס סיסמה, הזן קודם את כתובת המייל שלך בשדה למעלה.";
        emailInput.focus(); // שם את הסמן בשדה המייל
        return;
    }

    console.log("מנסה לשלוח בקשת איפוס סיסמה ל-:", email);

    auth.sendPasswordResetEmail(email)
        .then(() => {
            console.log("Reset email sent successfully!");
            messageEl.style.color = "green";
            messageEl.textContent = "אימייל לאיפוס סיסמה נשלח! בדוק את תיבת הדואר (וגם את הספאם).";
        })
        .catch(err => {
            console.error("Forgot Password Error:", err.code, err.message);
            messageEl.style.color = "red";

            // הסבר על שגיאות נפוצות בשחזור
            switch (err.code) {
                case "auth/user-not-found":
                    messageEl.textContent = "לא נמצא משתמש עם כתובת אימייל זו.";
                    break;
                case "auth/invalid-email":
                    messageEl.textContent = "כתובת האימייל אינה תקינה.";
                    break;
                case "auth/unauthorized-domain":
                    messageEl.textContent = "שגיאת אבטחה: הדומיין (GitHub) לא מאושר ב-Firebase Console.";
                    break;
                default:
                    messageEl.textContent = "שגיאה בשליחת האיפוס: " + err.message;
            }
        });
});

// --- בדיקת מצב התחברות (אם המשתמש כבר מחובר) ---
auth.onAuthStateChanged(user => {
    if (user && (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"))) {
        console.log("User already logged in, redirecting...");
        window.location.href = "dashboard.html";
    }
});
