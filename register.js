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

    // הגדרות חזרה לאחר אישור המייל - עוזר למנוע חסימת ספאם
    const actionCodeSettings = {
        url: 'https://pcs365.co.il/index.html', // הכתובת אליה המשתמש יופנה לאחר הלחיצה במייל
        handleCodeInApp: true,
    };

    // 2. ביצוע הרישום ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created successfully:", user.uid);

            // הגדרת שפת המייל לפי שפת הדפדפן של המשתמש
            auth.useDeviceLanguage();

            // 3. שליחת מייל אימות עם ההגדרות החדשות
            return user.sendEmailVerification(actionCodeSettings)
                .then(() => {
                    console.log("Verification email triggered successfully to:", user.email);
                    
                    messageEl.style.color = "green";
                    messageEl.textContent = isEn 
                        ? "Account created! A verification email has been sent. Please check your Inbox and SPAM folder." 
                        : "החשבון נוצר! מייל אימות נשלח אליך. אנא בדוק את תיבת הדואר (וגם בספאם).";
                    
                    // 4. התנתקות כדי שלא יוכל להיכנס בלי אישור
                    auth.signOut();

                    // הפניה לעמוד התחברות לאחר 6 שניות
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 6000);
                })
                .catch(emailErr => {
                    console.error("Error sending verification email:", emailErr.code, emailErr.message);
                    messageEl.style.color = "orange";
                    messageEl.textContent = isEn 
                        ? "Account created, but email failed to send. Please check Authorized Domains in Firebase." 
                        : "החשבון נוצר, אך המייל לא נשלח. וודא שהדומיין מאושר ב-Firebase.";
                });
        })
        .catch(err => {
            console.error("Firebase Registration Error:", err.code, err.message);
            
            messageEl.style.color = "red";
            let errorMsg = err.message;

            // תרגום שגיאות נפוצות
            if (!isEn) {
                if (err.code === 'auth/email-already-in-use') errorMsg = "כתובת האימייל כבר קיימת במערכת.";
                if (err.code === 'auth/invalid-email') errorMsg = "כתובת אימייל לא תקינה.";
                if (err.code === 'auth/weak-password') errorMsg = "הסיסמה חלשה מדי.";
            }

            messageEl.textContent = (isEn ? "Error: " : "שגיאה: ") + errorMsg;
        });
});
