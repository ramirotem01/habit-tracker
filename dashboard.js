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
    if (!logBox) return;
    const p = document.createElement("div");
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // תאריך לתצוגה
  const now = new Date();
  todayDateEl.textContent = now.toLocaleDateString("he-IL");
  
  // מפתח בטוח ל-DB (ללא סלאשים)
  const todayDocId = now.toISOString().split('T')[0]; 

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
    log("משתמש מחובר: " + userId);
    loadAll();
  });

  async function loadAll() {
    log("טוען נתונים...");
    try {
      // טעינת הרגלים קבועים
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(d => d.data().text);

      // טעינת משימות חד פעמיות
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(d => d.data().text);

      // טעינת סטטוס ביצוע
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      log("שגיאה בטעינה: " + err.message);
    }
  }

  function render() {
    habitListEl.innerHTML = "";
    const all = [...baseHabits, ...tempHabits];
    let done = 0;

    all.forEach(text => {
      const isDone = dailyStats[text] === true;
      if (isDone) done++;

      const li = document.createElement("li");
      li.className = "habit-item";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.padding = "8px";
      li.style.borderBottom = "1px solid #eee";

      const span = document.createElement("span");
      span.textContent = text;
      if (isDone) span.style.textDecoration = "line-through";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.onchange = async () => {
        dailyStats[text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); // רינדור מחדש לעדכון המונים
      };

      li.append(span, cb);
      habitListEl.appendChild(li);
    });

    totalHabitsEl.textContent = all.length;
    doneTodayEl.textContent = done;
    progressTodayEl.textContent = `${done}/${all.length}`;

    renderHistory();
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text });
      tempHabitInput.value = "";
      loadAll();
    } catch (err) {
      log("שגיאה בהוספה: " + err.message);
    }
  });

  async function renderHistory() {
    try {
      const snap = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      snap.docs.forEach(doc => {
        const data = doc.data();
        const doneCount = Object.values(data).filter(v => v === true).length;
        const div = document.createElement("div");
        div.className = "history-item";
        div.textContent = `${doc.id}: ${doneCount} הושלמו`;
        historyEl.appendChild(div);
      });
    } catch (err) {
      console.error("History error", err);
    }
  }

  window.goManage = () => window.location.href = "manage.html";
  logoutBtn.onclick = () => auth.signOut();
});
