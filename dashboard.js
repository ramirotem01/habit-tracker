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

  // תאריך בפורמט בטוח ל-DB (ISO)
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
    log("מחובר כ: " + user.email);
    loadAll();
  });

  async function loadAll() {
    try {
      log("טוען נתונים מהשרת...");
      // קריאה מקבילה לכל הנתונים
      const [baseSnap, tempSnap, statsSnap] = await Promise.all([
        db.collection("users").doc(userId).collection("habits").get(),
        db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").get(),
        db.collection("users").doc(userId).collection("stats").doc(todayDocId).get()
      ]);

      // חילוץ הנתונים
      baseHabits = baseSnap.docs.map(d => d.data().text);
      tempHabits = tempSnap.docs.map(d => d.data().text); // כאן דאגנו לחלץ את ה-text
      dailyStats = statsSnap.exists ? statsSnap.data() : {};

      log(`נטענו ${baseHabits.length} הרגלים קבועים ו-${tempHabits.length} משימות`);
      render();
    } catch (err) {
      log("שגיאה בטעינה: " + err.message);
      console.error(err);
    }
  }

  function render() {
    habitListEl.innerHTML = "";
    const all = [...baseHabits, ...tempHabits];

    if (all.length === 0) {
      habitListEl.innerHTML = "<li style='color:gray; padding:10px;'>אין משימות להיום</li>";
    }

    all.forEach(text => {
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.style.padding = "8px 0";
      li.style.borderBottom = "1px solid #eee";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.style.marginLeft = "10px";
      cb.checked = dailyStats[text] || false;
      
      cb.onchange = () => toggleHabit(text, cb.checked);
      
      const span = document.createElement("span");
      span.textContent = text;
      if (cb.checked) span.style.textDecoration = "line-through";

      li.append(cb, span);
      habitListEl.appendChild(li);
    });

    updateSummary();
    renderHistory();
  }

  async function toggleHabit(name, isChecked) {
    dailyStats[name] = isChecked;
    try {
      await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      updateSummary();
      // עדכון ויזואלי מהיר בלי לרנדר מחדש הכל
      render(); 
    } catch (err) {
      log("שגיאה בעדכון: " + err.message);
    }
  }

  function updateSummary() {
    const allCount = baseHabits.length + tempHabits.length;
    const doneCount = [...baseHabits, ...tempHabits].filter(t => dailyStats[t] === true).length;
    
    totalHabitsEl.textContent = allCount;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${allCount}`;
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text });
      tempHabitInput.value = "";
      log("הוספה משימה חדשה");
      loadAll(); 
    } catch (err) {
      log("שגיאה בהוספה: " + err.message);
    }
  });

  async function renderHistory() {
    try {
      const snapshot = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const doneCount = Object.values(data).filter(v => v === true).length;
        const div = document.createElement("div");
        div.style.fontSize = "14px";
        div.style.marginBottom = "5px";
        div.textContent = `${doc.id}: ${doneCount} הושלמו`;
        historyEl.appendChild(div);
      });
    } catch (err) {}
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });

  window.goManage = function() {
    window.location.href = "manage.html";
  };
});
