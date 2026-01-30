document.addEventListener("DOMContentLoaded", function() {
    // מזהי תאריכים
    const todayObj = new Date();
    const todayId = todayObj.toISOString().split('T')[0]; // פורמט 2024-05-20
    
    // אלמנטים
    const habitListEl = document.getElementById("habitList");
    const totalHabitsEl = document.getElementById("totalHabits");
    const doneTodayEl = document.getElementById("doneToday");
    const progressTodayEl = document.getElementById("progressToday");
    const todayDateEl = document.getElementById("todayDate");
    const logBox = document.getElementById("logBox");

    if(todayDateEl) todayDateEl.textContent = todayObj.toLocaleDateString("he-IL");

    let userId = null;
    let baseHabits = [];
    let tempHabits = [];
    let dailyStats = {};

    // פונקציית עזר להצגת הודעות
    function log(msg) {
        console.log(msg);
        if(logBox) {
            logBox.innerHTML += `<div>${msg}</div>`;
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    // בדיקת חיבור
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        userId = user.uid;
        log("מחובר כ: " + user.email);
        loadAllData();
    });

    async function loadAllData() {
        try {
            // 1. טעינת הרגלים קבועים
            const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
            baseHabits = baseSnap.docs.map(d => d.data().text || "ללא שם");

            // 2. טעינת משימות חד פעמיות
            const tempSnap = await db.collection("users").doc(userId).collection("daily")
                .doc(todayId).collection("tempHabits").get();
            tempHabits = tempSnap.docs.map(d => d.data().text || "ללא שם");

            // 3. טעינת סטטוס ביצוע
            const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayId).get();
            dailyStats = statsDoc.exists ? statsDoc.data() : {};

            renderUI();
        } catch (err) {
            log("שגיאה: " + err.message);
        }
    }

    function renderUI() {
        if (!habitListEl) return;
        habitListEl.innerHTML = "";
        
        const allTasks = [...baseHabits, ...tempHabits];
        let doneCount = 0;

        allTasks.forEach(text => {
            const isDone = dailyStats[text] === true;
            if(isDone) doneCount++;

            const li = document.createElement("li");
            li.style.margin = "10px 0";
            li.style.listStyle = "none";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = isDone;
            cb.style.marginLeft = "10px";
            
            cb.onchange = async () => {
                dailyStats[text] = cb.checked;
                await db.collection("users").doc(userId).collection("stats").doc(todayId).set(dailyStats);
                renderUI(); // רינדור מחדש קל לעדכון מספרים
            };

            const span = document.createElement("span");
            span.textContent = text;
            if(isDone) span.style.textDecoration = "line-through";

            li.appendChild(cb);
            li.appendChild(span);
            habitListEl.appendChild(li);
        });

        // עדכון המספרים למעלה
        if(totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
        if(doneTodayEl) doneTodayEl.textContent = doneCount;
        if(progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
        
        loadHistory();
    }

    // הוספת משימה חד פעמית
    document.getElementById("addTempHabitBtn").onclick = async () => {
        const input = document.getElementById("tempHabitInput");
        const val = input.value.trim();
        if(!val) return;
        
        try {
            await db.collection("users").doc(userId).collection("daily")
                .doc(todayId).collection("tempHabits").add({ text: val });
            input.value = "";
            loadAllData();
        } catch(e) { log("שגיאה בהוספה: " + e.message); }
    };

    async function loadHistory() {
        const historyEl = document.getElementById("history");
        if(!historyEl) return;
        const snap = await db.collection("users").doc(userId).collection("stats").limit(7).get();
        historyEl.innerHTML = "";
        snap.forEach(doc => {
            const tasks = Object.values(doc.data()).filter(v => v === true).length;
            historyEl.innerHTML += `<div>${doc.id}: ${tasks} בוצעו</div>`;
        });
    }

    document.getElementById("logoutBtn").onclick = () => auth.signOut();
    window.goManage = () => window.location.href = "manage.html";
});
