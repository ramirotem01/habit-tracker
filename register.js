const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerBtn = document.getElementById("executeRegisterBtn");
const messageEl = document.getElementById("regMessage");

// זיהוי שפה מהיר (עברית/אנגלית)
const isEn = !navigator.language.startsWith('he');

registerBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    console.log("Attempting to register:", email);

    // 1. ולידציה בסיסית של השדות
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

    // 2. ביצוע הרישום ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created successfully in Firebase:", user.uid);

            // 3. שליחת מייל אימות (Verification Email)
            return user.sendEmailVerification()
                .then(() => {
                    console.log("Verification email sent to:", user.email);
                    
                    messageEl.style.color = "green";
                    messageEl.textContent = isEn 
                        ? "Account created! A verification email has been sent. Please check your inbox (and spam)." 
                        : "החשבון נוצר! מייל אימות נשלח אליך. אנא בדוק את תיבת הדואר (והספאם).";
                    
                    // 4. התנתקות כדי למנוע כניסה ללא אימות
                    auth.signOut().then(() => {
                        console.log("User signed out until email is verified.");
                    });

                    // הפניה לעמוד התחברות לאחר 5 שניות
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 5000);
                })
                .catch(emailErr => {
                    console.error("Error sending verification email:", emailErr.code, emailErr.message);
                    messageEl.style.color = "orange";
                    messageEl.textContent = isEn 
                        ? "Account created, but failed to send verification email. Please contact support." 
                        : "החשבון נוצר, אך חלה שגיאה בשליחת המייל. פנה לתמיכה.";
                });
        })
        .catch(err => {
            // טיפול בשגיאות רישום (אימייל קיים, פורמט לא תקין וכו')
            console.error("Firebase Registration Error:", err.code, err.message);
            
            messageEl.style.color = "red";
            let errorMsg = err.message;

            // תרגום שגיאות נפוצות לעברית (אופציונלי)
            if (!isEn) {
                if (err.code === 'auth/email-already-in-use') errorMsg = "כתובת האימייל כבר קיימת במערכת.";
                if (err.code === 'auth/invalid-email') errorMsg = "כתובת אימייל לא תקינה.";
                if (err.code === 'auth/weak-password') errorMsg = "הסיסמה חלשה מדי.";
            }

            const errorPrefix = isEn ? "Registration error: " : "שגיאה ברישום: ";
            messageEl.textContent = errorPrefix + errorMsg;
        });
});
