document.addEventListener("DOMContentLoaded", function() {
    // 1. הגדרת תאריך היום לשימוש ב-DB
    const todayObj = new Date();
    const todayId = todayObj.toISOString().split('T')[0]; // פורמט: YYYY-MM-DD
    
    // 2. חיבור אלמנטים מה-HTML
    const habitListEl = document.getElementById("habitList");
    const totalHabitsEl = document.getElementById("totalHabits");
    const doneTodayEl = document.getElementById("doneToday");
    const progressTodayEl = document.getElementById("progressToday");
    const todayDateEl = document.getElementById("todayDate");
    const logBox = document.getElementById("logBox");

    if (todayDateEl) todayDateEl.textContent = todayObj.toLocaleDateString("he-IL");

    let userId = null;
    let baseHabits = []; // הרגלים קבועים
    let tempHabits = []; // משימות חד פעמיות
    let dailyStats = {}; // סטטוס סימוני V

    function log(msg) {
        console.log(msg);
        if (logBox) {
            logBox.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    // 3. האזנה לחיבור המשתמש (Auth)
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        userId = user.uid;
        log("מחובר בהצלחה: " + user.email);
        loadAllData();
    });

    // 4. משיכת כל הנתונים מ-Firestore
    async function loadAllData() {
        try {
            log("טוען נתונים מהשרת...");
            
            // משיכת הרגלים קבועים מדף הניהול
            const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
            baseHabits = baseSnap.docs.map(d => d.data().text);

            // משיכת משימות חד פעמיות של היום
            const tempSnap = await db.collection("users").doc(userId).collection("daily")
                .doc(todayId).collection("tempHabits").get();
            tempHabits = tempSnap.docs.map(d => d.data().text);

            // משיכת סימוני הצ'קבוקס של היום
            const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayId).get();
            dailyStats = statsDoc.exists ? statsDoc.data() : {};

            renderUI();
        } catch (err) {
            log("שגיאה בטעינה: " + err.message);
        }
    }

    // 5. רינדור הרשימה והסטטיסטיקה
    function renderUI() {
        if (!habitListEl) return;
        habitListEl.innerHTML = "";
        
        // איחוד: קבועים קודם, אז משימות להיום
        const allTasks = [...baseHabits, ...tempHabits];
        let doneCount = 0;

        allTasks.forEach(text => {
            const isDone = dailyStats[text] === true;
            if (isDone) doneCount++;

            const li = document.createElement("li");
            li.className = "habit-item"; // וודא שיש לך עיצוב לזה ב-CSS
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.margin = "8px 0";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = isDone;
            cb.style.marginLeft = "12px";
            
            cb.onchange = async () => {
                dailyStats[text] = cb.checked;
                // שמירה לשרת
                await db.collection("users").doc(userId).collection("stats").doc(todayId).set(dailyStats);
                renderUI(); // רענון למספרים ועיצוב
            };

            const span = document.createElement("span");
            span.textContent = text;
            if (isDone) span.style.textDecoration = "line-through";

            li.appendChild(cb);
            li.appendChild(span);
            habitListEl.appendChild(li);
        });

        // עדכון קומת הסטטיסטיקה (המספרים למעלה)
        if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
        if (doneTodayEl) doneTodayEl.textContent = doneCount;
        if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
        
        renderHistory();
    }

    // 6. הוספת משימה חד פעמית
    document.getElementById("addTempHabitBtn").onclick = async () => {
        const input = document.getElementById("tempHabitInput");
        const val = input.value.trim();
        if (!val) return;
        
        try {
            await db.collection("users").doc(userId).collection("daily")
                .doc(todayId).collection("tempHabits").add({ text: val });
            input.value = "";
            log("משימה חד-פעמית נוספה");
            loadAllData(); // טעינה מחדש של הכל
        } catch (e) { 
            log("שגיאה בהוספה: " + e.message); 
        }
    };

    // 7. היסטוריה של ה-14 ימים האחרונים
    async function renderHistory() {
        const historyEl = document.getElementById("history");
        if (!historyEl) return;
        
        try {
            const snap = await db.collection("users").doc(userId).collection("stats")
                .orderBy("__name__", "desc").limit(14).get();
            
            historyEl.innerHTML = "";
            snap.forEach(doc => {
                const count = Object.values(doc.data()).filter(v => v === true).length;
                const div = document.createElement("div");
                div.style.fontSize = "13px";
                div.style.padding = "4px 0";
                div.textContent = `${doc.id}: ${count} משימות בוצעו`;
                historyEl.appendChild(div);
            });
        } catch (e) {
            // שגיאה שקטה בהיסטוריה כדי לא להפריע לדשבורד
        }
    }

    // ניווט והתנתקות
    document.getElementById("logoutBtn").onclick = () => auth.signOut();
    window.goManage = () => window.location.href = "manage.html";
});
