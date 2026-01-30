document.addEventListener("DOMContentLoaded", () => {
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const historyEl = document.getElementById("history");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // תאריכים
  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; // פורמט YYYY-MM-DD (בטוח ל-DB)
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};

  // בדיקת חיבור
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    loadData();
  });

  // טעינה משולבת
  async function loadData() {
    try {
      // 1. הרגלים קבועים (כמו בדף הניהול)
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(d => d.data().text);

      // 2. משימות חד פעמיות
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(d => d.data().text);

      // 3. סימוני V
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  function render() {
    habitListEl.innerHTML = "";
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(text => {
      const isDone = dailyStats[text] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.padding = "10px 0";
      li.style.borderBottom = "1px solid #eee";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.style.marginLeft = "10px";
      
      cb.onchange = async () => {
        dailyStats[text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); // עדכון מונים ועיצוב
      };

      const span = document.createElement("span");
      span.textContent = text;
      if (isDone) span.style.textDecoration = "line-through";

      li.append(cb, span);
      habitListEl.appendChild(li);
    });

    // עדכון סטטיסטיקה למעלה
    totalHabitsEl.textContent = allTasks.length;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    loadHistory();
  }

  // הוספת משימה חד פעמית
  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;

    await db.collection("users").doc(userId).collection("daily")
      .doc(todayDocId).collection("tempHabits").add({ text });
    
    tempHabitInput.value = "";
    loadData();
  });

  // היסטוריה פשוטה
  async function loadHistory() {
    const snap = await db.collection("users").doc(userId).collection("stats")
      .orderBy("__name__", "desc").limit(14).get();
    
    historyEl.innerHTML = "";
    snap.forEach(doc => {
      const done = Object.values(doc.data()).filter(v => v === true).length;
      const div = document.createElement("div");
      div.style.fontSize = "13px";
      div.textContent = `${doc.id}: ${done} בוצעו`;
      historyEl.appendChild(div);
    });
  }

  logoutBtn.onclick = () => auth.signOut();
});
