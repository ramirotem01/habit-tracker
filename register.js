const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerBtn = document.getElementById("executeRegisterBtn");
const messageEl = document.getElementById("regMessage");

// זיהוי שפה מהיר
const isEn = !navigator.language.startsWith('he');

registerBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ולידציה בסיסית
    if (!email || !password || !confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = isEn ? "Please fill in all fields" : "אנא מלא את כל השדות";
        return;
    }

    if (password !== confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = isEn ? "Passwords do not match" : "הסיסמאות אינן תואמות";
        return;
    }

    if (password.length < 6) {
        messageEl.style.color = "red";
        messageEl.textContent = isEn ? "Password must be at least 6 characters" : "על הסיסמה להכיל לפחות 6 תווים";
        return;
    }

    // ביצוע הרישום ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = isEn ? "Account created! Redirecting..." : "החשבון נוצר בהצלחה! מעביר אותך...";
            setTimeout(() => {
                window.location.href = "firstgoal.html";
            }, 1500);
        })
        .catch(err => {
            messageEl.style.color = "red";
            const errorPrefix = isEn ? "Registration error: " : "שגיאה ברישום: ";
            messageEl.textContent = errorPrefix + err.message;
        });
});
