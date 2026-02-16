const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerBtn = document.getElementById("executeRegisterBtn");
const messageEl = document.getElementById("regMessage");

// מילון הודעות לוגיקה לרישום
const regLogicMsg = {
    he: {
        fillAll: "אנא מלא את כל השדות",
        noMatch: "הסיסמאות אינן תואמות",
        tooShort: "על הסיסמה להכיל לפחות 6 תווים",
        success: "החשבון נוצר בהצלחה! מעביר אותך...",
        errorPrefix: "שגיאה ברישום: ",
        emailExists: "כתובת האימייל כבר קיימת במערכת",
        invalidEmail: "כתובת אימייל לא תקינה"
    },
    en: {
        fillAll: "Please fill in all fields",
        noMatch: "Passwords do not match",
        tooShort: "Password must be at least 6 characters",
        success: "Account created successfully! Redirecting...",
        errorPrefix: "Registration error: ",
        emailExists: "This email address is already registered",
        invalidEmail: "Invalid email address"
    }
};

// זיהוי שפה
const userLang = navigator.language.startsWith('he') ? 'he' : 'en';
const m = regLogicMsg[userLang];

registerBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ולידציה בסיסית
    if (!email || !password || !confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = m.fillAll;
        return;
    }

    if (password !== confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = m.noMatch;
        return;
    }

    if (password.length < 6) {
        messageEl.style.color = "red";
        messageEl.textContent = m.tooShort;
        return;
    }

    // ביצוע הרישום ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = m.success;
            setTimeout(() => {
                window.location.href = "firstgoal.html";
            }, 1500);
        })
        .catch(err => {
            messageEl.style.color = "red";
            console.error("Register Error:", err.code);
            
            // תרגום שגיאות ספציפיות של Firebase
            if (err.code === "auth/email-already-in-use") {
                messageEl.textContent = m.emailExists;
            } else if (err.code === "auth/invalid-email") {
                messageEl.textContent = m.invalidEmail;
            } else {
                messageEl.textContent = m.errorPrefix + err.message;
            }
        });
});
