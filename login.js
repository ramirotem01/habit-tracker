// קישור לאלמנטים מה-HTML
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const messageEl = document.getElementById("message");
const captchaContainer = document.getElementById("captcha-container");

// מילון הודעות לוגיקה (דו-לשוני)
const logicMsg = {
    he: {
        fill: "אנא מלא/י אימייל וסיסמה",
        loading: "התחברת בהצלחה! בודק נתונים...",
        authError: "אימייל או סיסמה שגויים",
        tooMany: "יותר מדי נסיונות כושלים. החשבון ננעל זמנית.",
        general: "שגיאה בהתחברות: ",
        resetPrompt: "כדי לאפס סיסמה, הזן קודם את כתובת המייל שלך בשדה למעלה.",
        resetSuccess: "אימייל לאיפוס סיסמה נשלח! בדוק את תיבת הדואר.",
        resetError: "שגיאה בשליחת האיפוס: "
    },
    en: {
        fill: "Please enter email and password",
        loading: "Logged in successfully! Checking data...",
        authError: "Incorrect email or password",
        tooMany: "Too many failed attempts. Account temporarily locked.",
        general: "Login error: ",
        resetPrompt: "To reset your password, please enter your email address above first.",
        resetSuccess: "Password reset email sent! Check your inbox.",
        resetError: "Reset error: "
    }
};

// זיהוי שפה
const currentLang = navigator.language.startsWith('he') ? 'he' : 'en';
const m = logicMsg[currentLang];

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
        window.location.href = "dashboard.html";
    }
}

// --- מנגנון התחברות ---
loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        messageEl.style.color = "red";
        messageEl.textContent = m.fill;
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            messageEl.style.color = "green";
            messageEl.textContent = m.loading;
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
                messageEl.textContent = m.authError;
            } else if (err.code === "auth/too-many-requests") {
                messageEl.textContent = m.tooMany;
            } else {
                messageEl.textContent = m.general + err.message;
            }
        });
});

// --- מנגנון שכחתי סיסמה ---
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        messageEl.style.color = "red";
        messageEl.textContent = m.resetPrompt;
        emailInput.focus();
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = m.resetSuccess;
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = m.resetError + err.message;
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
