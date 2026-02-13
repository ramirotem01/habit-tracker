const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerBtn = document.getElementById("executeRegisterBtn");
const messageEl = document.getElementById("regMessage");

registerBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // ולידציה בסיסית
    if (!email || !password || !confirmPassword) {
        messageEl.textContent = "אנא מלא את כל השדות";
        return;
    }

    if (password !== confirmPassword) {
        messageEl.style.color = "red";
        messageEl.textContent = "הסיסמאות אינן תואמות";
        return;
    }

    if (password.length < 6) {
        messageEl.style.color = "red";
        messageEl.textContent = "על הסיסמה להכיל לפחות 6 תווים";
        return;
    }

    // ביצוע הרישום ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            messageEl.style.color = "green";
            messageEl.textContent = "החשבון נוצר בהצלחה! מעביר אותך...";
            setTimeout(() => {
                window.location.href = "firstgoal.html";
            }, 1500);
        })
        .catch(err => {
            messageEl.style.color = "red";
            messageEl.textContent = "שגיאה ברישום: " + err.message;
        });
});
