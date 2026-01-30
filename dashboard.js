document.addEventListener("DOMContentLoaded", function() {
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

  // שימוש בפורמט תאריך בטוח ל-DB (למשל 2023-10-27)
  const todayObj = new Date();
  const todayDocId = todayObj.toISOString().split('T')[0]; 
  todayDateEl.textContent = todayObj.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    log("מחובר כ- " + user.email);
    loadAll();
  });

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });

  window.goManage = function() {
    window.location.href = "manage.html";
  };

  async function loadAll() {
    try {
      log("טוען נתונים...");
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
    tempHabits = snap.docs.map(d => ({ id: d.id, text: d.data().text }));
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
      log("הוסף: " + text);
      loadAll(); // רענון אחרי הוספה
    } catch (err) {
      log("שגיאה בהוספה: " + err.message);
    }
  });

  async function toggleHabit(name, isChecked) {
    dailyStats[name] = isChecked;
    try {
      await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      log(`עודכן: ${name}`);
      // כאן אנחנו מעדכנים רק את המספרים ב-UI בלי לרנדר את כל הרשימה מחדש
      updateSummary(); 
    } catch (err) {
      log("שגיאה בעדכון: " + err.message);
    }
  }

  function updateSummary() {
    const allCount = baseHabits.length + tempHabits.length;
    const doneCount = Object.values(dailyStats).filter(v => v === true).length;
    
    totalHabitsEl.textContent = allCount;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${allCount}`;
  }

  function render() {
    habitListEl.innerHTML = "";
    const all = [...baseHabits, ...tempHabits.map(h => h.text)];

    all.forEach(text => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = dailyStats[text] || false;
      
      cb.onchange = () => toggleHabit(text, cb.checked);
      
      li.append(cb, " " + text);
      habitListEl.appendChild(li);
    });

    updateSummary();
    renderHistory();
  }

  async function renderHistory() {
    try {
      const snapshot = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      snapshot.docs.forEach(doc => {
        const dateStr = doc.id;
        const data = doc.data();
        const doneCount = Object.values(data).filter(v => v === true).length;
        
        const div = document.createElement("div");
        div.className = "history-item";
        div.textContent = `${dateStr}: ${doneCount} הרגלים בוצעו`;
        historyEl.appendChild(div);
      });
    } catch (err) {
      log("שגיאה בהיסטוריה: " + err.message);
    }
  }
});
