document.addEventListener("DOMContentLoaded", function() {
  const baseHabitListEl = document.getElementById("baseHabitList");
  const tempHabitListEl = document.getElementById("tempHabitList");
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
    p.textContent = msg;
    logBox.appendChild(p);
  }

  // תאריך בפורמט בטוח ל-DB
  const todayDate = new Date();
  const todayId = todayDate.toISOString().split('T')[0];
  todayDateEl.textContent = todayDate.toLocaleDateString("he-IL");

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
    loadAll();
  });

  async function loadAll() {
    try {
      // טעינת כל הנתונים במקביל
      const [baseSnap, tempSnap, statsSnap] = await Promise.all([
        db.collection("users").doc(userId).collection("habits").get(),
        db.collection("users").doc(userId).collection("daily").doc(todayId).collection("tempHabits").get(),
        db.collection("users").doc(userId).collection("stats").doc(todayId).get()
      ]);

      baseHabits = baseSnap.docs.map(d => d.data().text);
      tempHabits = tempSnap.docs.map(d => d.data().text);
      dailyStats = statsSnap.exists ? statsSnap.data() : {};

      render();
    } catch (err) {
      log("שגיאה בטעינה: " + err.message);
    }
  }

  function render() {
    baseHabitListEl.innerHTML = "";
    tempHabitListEl.innerHTML = "";

    // רינדור הרגלים קבועים
    baseHabits.forEach(text => {
      baseHabitListEl.appendChild(createItem(text));
    });

    // רינדור משימות חד פעמיות
    tempHabits.forEach(text => {
      tempHabitListEl.appendChild(createItem(text));
    });

    updateSummary();
    renderHistory();
  }

  function createItem(text) {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = async () => {
      dailyStats[text] = cb.checked;
      await db.collection("users").doc(userId).collection("stats").doc(todayId).set(dailyStats);
      updateSummary();
    };
    li.append(cb, " " + text);
    return li;
  }

  function updateSummary() {
    const all = [...baseHabits, ...tempHabits];
    const done = all.filter(t => dailyStats[t] === true).length;
    
    totalHabitsEl.textContent = all.length;
    doneTodayEl.textContent = done;
    progressTodayEl.textContent = `${done}/${all.length}`;
  }

  async function renderHistory() {
    const snap = await db.collection("users").doc(userId).collection("stats").limit(14).get();
    historyEl.innerHTML = "";
    snap.docs.forEach(doc => {
      const d = doc.data();
      const count = Object.values(d).filter(v => v === true).length;
      const div = document.createElement("div");
      div.textContent = `${doc.id}: ${count} משימות בוצעו`;
      historyEl.appendChild(div);
    });
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const val = tempHabitInput.value.trim();
    if (!val) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayId).collection("tempHabits").add({ text: val });
    tempHabitInput.value = "";
    loadAll();
  });

  logoutBtn.addEventListener("click", () => auth.signOut());
  window.goManage = () => window.location.href = "manage.html";
});
