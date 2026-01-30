document.addEventListener("DOMContentLoaded", function() {
    // 1. הגדרת אלמנטים - לוודא שכל ה-IDs תואמים ל-HTML שלך
    const habitListEl = document.getElementById("habitList");
    const totalHabitsEl = document.getElementById("totalHabits");
    const doneTodayEl = document.getElementById("doneToday");
    const progressTodayEl = document.getElementById("progressToday");
    const todayDateEl = document.getElementById("todayDate");
    const historyEl = document.getElementById("history");
    const tempHabitInput = document.getElementById("tempHabitInput");
    const addTempHabitBtn = document.getElementById("addTempHabitBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const logBox = document.getElementById("logBox");

    // פונקציית לוג פשוטה לאיתור תקלות
    function log(msg) {
        if (logBox) {
            const p = document.createElement("div");
            p.textContent = `> ${msg}`;
            logBox.appendChild(p);
            logBox.scrollTop = logBox.scrollHeight;
        }
        console.log(msg);
    }

    // הגדרת תאריך היום (מפתח למסד הנתונים)
    const todayObj = new Date();
    const todayDocId = todayObj.toISOString().split('T')[0]; // פורמט YYYY-MM-DD
    if (todayDateEl) todayDateEl.textContent = todayObj.toLocaleDateString("he-IL");

    let userId = null;
    let baseHabits = [];
    let tempHabits = [];
    let dailyStats = {};

    // 2. האזנה לחיבור המשתמש
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        userId = user.uid;
        log("משתמש מחובר בהצלחה");
        loadAll();
    });

    // 3. טעינת נתונים מה-Firebase
    async function loadAll() {
        try {
            log("מושך נתונים מה-DB...");
            
            // משיכת הרגלים קבועים
            const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
            baseHabits = baseSnap.docs.map(d => d.data().text);

            // משיכת משימות חד פעמיות להיום
            const tempSnap = await db.collection("users").doc(userId).collection("daily")
                .doc(todayDocId).collection("tempHabits").get();
            tempHabits = tempSnap.docs.map(d => d.data().text);

            // משיכת סימוני V להיום
            const statsSnap = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
            dailyStats = statsSnap.exists ? statsSnap.data() : {};

            render();
        } catch (err) {
            log("שגיאה בטעינה: " + err.message);
        }
    }

    // 4. רינדור הרשימה לתוך ה-HTML
    function render() {
        if (!habitListEl) return;
        habitListEl.innerHTML = "";
        
        // איחוד הרשימות: קבועים קודם, אחר כך חד פעמיים
        const allTasks = [...baseHabits, ...tempHabits];

        allTasks.forEach(text => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.padding = "5px 0";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.style.marginLeft = "10px";
            cb.checked = dailyStats[text] || false;
            
            cb.onchange = async () => {
                dailyStats[text] = cb.checked;
                await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
                updateSummary();
                if (cb.checked) li.style.opacity = "0.6"; else li.style.opacity = "1";
            };

            const span = document.createElement("span");
            span.textContent = text;
            
            li.appendChild(cb);
            li.appendChild(span);
            habitListEl.appendChild(li);
        });

        updateSummary();
        loadHistory();
    }

    // 5. עדכון המספרים בראש הדף
    function updateSummary() {
        const allTasks = [...baseHabits, ...tempHabits];
        const doneCount = allTasks.filter(t => dailyStats[t] === true).length;
        
        if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
        if (doneTodayEl) doneTodayEl.textContent = doneCount;
        if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    }

    // 6. הוספת משימה חד פעמית
    addTempHabitBtn.addEventListener("click", async () => {
        const text = tempHabitInput.value.trim();
        if (!text) return;

        try {
            await db.collection("users").doc(userId).collection("daily")
                .doc(todayDocId).collection("tempHabits").add({ text });
            tempHabitInput.value = "";
            log("משימה נוספה");
            loadAll(); // רענון מלא
        } catch (err) {
            log("שגיאה בהוספה: " + err.message);
        }
    });

    // 7. היסטוריה (14 יום)
    async function loadHistory() {
        try {
            const snap = await db.collection("users").doc(userId).collection("stats")
                .orderBy("__name__", "desc").limit(14).get();
            
            if (historyEl) {
                historyEl.innerHTML = "";
                snap.docs.forEach(doc => {
                    const count = Object.values(doc.data()).filter(v => v === true).length;
                    const div = document.createElement("div");
                    div.style.fontSize = "0.9em";
                    div.textContent = `${doc.id}: ${count} משימות בוצעו`;
                    historyEl.appendChild(div);
                });
            }
        } catch (err) {}
    }

    // התנתקות וניהול
    logoutBtn.addEventListener("click", () => auth.signOut());
    window.goManage = () => window.location.href = "manage.html";
});
