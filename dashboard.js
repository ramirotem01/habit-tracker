document.addEventListener("DOMContentLoaded", function() {
    // אלמנטים מה-DOM
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

    function log(msg) {
        const p = document.createElement("div");
        p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // ניהול תאריכים
    const todayObj = new Date();
    const todayDocId = todayObj.toISOString().split('T')[0]; 
    todayDateEl.textContent = todayObj.toLocaleDateString("he-IL");

    let userId = null;
    let baseHabits = []; // הרגלים קבועים מהדף השני
    let tempHabits = []; // משימות חד פעמיות
    let dailyStats = {}; // סטטוס סימון (V)

    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        userId = user.uid;
        log("מחובר למערכת");
        loadAll();
    });

    async function loadAll() {
        try {
            await Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()]);
            render();
        } catch (err) {
            log("שגיאה בטעינה: " + err.message);
        }
    }

    async function loadBaseHabits() {
        const snap = await db.collection("users").doc(userId).collection("habits").get();
        baseHabits = snap.docs.map(d => d.data().text);
    }

    async function loadTempHabits() {
        const snap = await db.collection("users").doc(userId).collection("daily")
            .doc(todayDocId).collection("tempHabits").get();
        tempHabits = snap.docs.map(d => d.data().text);
    }

    async function loadDailyStats() {
        const doc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
        dailyStats = doc.exists ? doc.data() : {};
    }

    addTempHabitBtn.addEventListener("click", async () => {
        const text = tempHabitInput.value.trim();
        if (!text) return;
        try {
            await db.collection("users").doc(userId).collection("daily")
                .doc(todayDocId).collection("tempHabits").add({ text });
            tempHabitInput.value = "";
            log("נוספה משימה חד פעמית");
            loadAll();
        } catch (err) {
            log("שגיאה בהוספה: " + err.message);
        }
    });

    async function toggleHabit(name, isChecked) {
        dailyStats[name] = isChecked;
        try {
            await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
            updateSummary(); // עדכון מהיר של המספרים למעלה
        } catch (err) {
            log("שגיאה בעדכון: " + err.message);
        }
    }

    function updateSummary() {
        const allTasks = [...baseHabits, ...tempHabits];
        const doneCount = allTasks.filter(t => dailyStats[t] === true).length;
        
        totalHabitsEl.textContent = allTasks.length;
        doneTodayEl.textContent = doneCount;
        progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    }

    function render() {
        habitListEl.innerHTML = "";
        // איחוד רשימת המשימות
        const allTasks = [...baseHabits, ...tempHabits];

        if (allTasks.length === 0) {
            habitListEl.innerHTML = "<li class='empty-msg'>אין משימות להיום. הוסף משימה או הגדר הרגלים.</li>";
        }

        allTasks.forEach(text => {
            const li = document.createElement("li");
            li.className = "habit-item";
            
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = dailyStats[text] || false;
            cb.onchange = () => toggleHabit(text, cb.checked);
            
            const span = document.createElement("span");
            span.textContent = text;

            li.appendChild(cb);
            li.appendChild(span);
            habitListEl.appendChild(li);
        });

        updateSummary();
        renderHistory();
    }

    // פונקציית היסטוריה (נשארה דומה)
    async function renderHistory() {
        const snapshot = await db.collection("users").doc(userId).collection("stats")
            .orderBy("__name__", "desc").limit(14).get();
        historyEl.innerHTML = "";
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const count = Object.values(data).filter(v => v === true).length;
            const item = document.createElement("div");
            item.className = "history-row";
            item.innerHTML = `<span>${doc.id}</span> <strong>${count} משימות</strong>`;
            historyEl.appendChild(item);
        });
    }

    logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => window.location.href = "login.html");
    });

    window.goManage = function() {
        window.location.href = "manage.html";
    };
});
