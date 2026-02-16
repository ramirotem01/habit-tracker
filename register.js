const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerBtn = document.getElementById("executeRegisterBtn");
const messageEl = document.getElementById("regMessage");

// אובייקט תרגום פשוט
const translations = {
    he: {
        fillAll: "אנא מלא את כל השדות",
        noMatch: "הסיסמאות אינן תואמות",
        tooShort: "על הסיסמה להכיל לפחות 6 תווים",
        success: "החשבון נוצר בהצלחה! מעביר אותך...",
        errorPrefix: "שגיאה ברישום: "
    },
    en: {
        fillAll: "Please fill in all fields",
        noMatch: "Passwords do not match",
        tooShort: "Password must be at least 6 characters",
        success: "Account created successfully! Redirecting...",
        errorPrefix: "Registration error: "
    }
};

// קביעת השפה
const userLang = navigator.language.startsWith('he') ? 'he' : 'en';
const t = translations[userLang];

registerBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ולידציה בסיסית
    if (!email || !password || !confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = t.fillAll;
        return;
    }

    if (password !== confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = t.noMatch;
        return;
    }

    if (password.length < 6) {
        messageEl.style.color = "red";
        messageEl.textContent = t.tooShort;
        return;
    }

    // ביצוע הרישום ב-Firebase - נשאר בדיוק כמו בגיבוי
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = t.success;
            setTimeout(() => {
                window.location.href = "firstgoal.html";
            }, 1500);
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = t.errorPrefix + err.message;
        });
});
