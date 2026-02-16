// קישור לאלמנטים מה-HTML
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const messageEl = document.getElementById("message");
const captchaContainer = document.getElementById("captcha-container");

// מערכת תרגום להודעות לוגיקה
const translations = {
    he: {
        fillFields: "אנא מלא/י אימייל וסיסמה",
        successLogin: "התחברת בהצלחה! בודק נתונים...",
        wrongAuth: "אימייל או סיסמה שגויים",
        tooManyRequests: "יותר מדי נסיונות כושלים. החשבון ננעל זמנית.",
        generalError: "שגיאה: ",
        resetPrompt: "כדי לאפס סיסמה, הזן קודם את כתובת המייל שלך בשדה למעלה.",
        resetSuccess: "אימייל לאיפוס סיסמה נשלח! בדוק את תיבת הדואר."
    },
    en: {
        fillFields: "Please enter email and password",
        successLogin: "Logged in successfully! Checking data...",
        wrongAuth: "Incorrect email or password",
        tooManyRequests: "Too many failed attempts. Account temporarily locked.",
        generalError: "Error: ",
        resetPrompt: "To reset your password, please enter your email address first.",
        resetSuccess: "Password reset email sent! Check your inbox."
    }
};

const userLang = navigator.language.startsWith('he') ? 'he' : 'en';
const t = translations[userLang];

let failedAttempts = 0;

/**
 * פונקציה לבדיקת קיום מטרה וניתוב המשתמש
 */
async function redirectBasedOnGoal(user) {
    try {
        const goalSnap = await db.collection("users").doc(user.uid).collection("goals").limit(1).get();
        if (!goalSnap.empty) {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "firstgoal.html";
        }
    } catch (e) {
        console.error("Error checking goals:", e);
        // במקרה של שגיאה, נבריח לדף הראשי כדי לא לתקוע את המשתמש
        window.location.href = "dashboard.html";
    }
}

// --- מנגנון התחברות ---
loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        messageEl.style.color = "red";
        messageEl.textContent = t.fillFields;
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            messageEl.style.color = "green";
            messageEl.textContent = t.successLogin;
            
            // בדיקת מטרה וניתוב
            redirectBasedOnGoal(userCredential.user);
        })
        .catch(err => {
            console.error("Login Error:", err.code, err.message);
            failedAttempts++;
            
            if (failedAttempts >= 5) {
                captchaContainer.style.display = "block";
            }

            messageEl.style.color = "red";
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                messageEl.textContent = t.wrongAuth;
            } else if (err.code === "auth/too-many-requests") {
                messageEl.textContent = t.tooManyRequests;
            } else {
                messageEl.textContent = t.generalError + err.message;
            }
        });
});

// --- מנגנון שכחתי סיסמה ---
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        messageEl.style.color = "red";
        messageEl.textContent = t.resetPrompt;
        emailInput.focus();
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = t.resetSuccess;
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = t.generalError + err.message;
        });
});

// --- בדיקת מצב התחברות (אם המשתמש כבר מחובר) ---
auth.onAuthStateChanged(user => {
    if (user && (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"))) {
        console.log("User already logged in, checking goals...");
        redirectBasedOnGoal(user);
    }
});

/**
 * מנגנון "השמדה עצמית" ל-Cache
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}
