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

  // הגדרת תאריך היום
  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = []; // הרגלים קבועים
  let tempHabits = []; // משימות חד פעמיות להיום
  let dailyStats = {}; // סטטוס ביצוע (V)

  // =====================
  // בדיקת חיבור משתמש
  // =====================
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    loadAllData();
  });

  // =====================
  // טעינת כל הנתונים מה-DB
  // =====================
  async function loadAllData() {
    try {
      // 1. טעינת הרגלים קבועים
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({
        text: doc.data().text,
        isTemp: false
      }));

      // 2. טעינת משימות חד פעמיות של היום
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        isTemp: true
      }));

      // 3. טעינת סטטוס הביצוע של היום
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינת הנתונים:", err);
    }
  }

  // =====================
  // הצגת רשימת המשימות
  // =====================
  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      li.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;";

      const contentSide = document.createElement("div");
      contentSide.style = "display: flex; align-items: center; gap: 10px;";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.style.transform = "scale(1.2)";
      cb.onchange = async () => {
        dailyStats[task.text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); 
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      if (isDone) span.style.textDecoration = "line-through";

      contentSide.appendChild(cb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      if (task.isTemp) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; margin-left:8px;";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.style = "background:none; border:none; cursor:pointer;";
        deleteBtn.onclick = () => deleteTempHabit(task.id, task.text);

        actionsSide.appendChild(editBtn);
        actionsSide.appendChild(deleteBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    renderHistory();
  }

  // =====================
  // ניהול משימות זמניות
  // =====================
  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text: text });
      tempHabitInput.value = "";
      loadAllData(); 
    } catch (err) {
      console.error("שגיאה בהוספה:", err);
    }
  });

  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את "${text}"?`)) return;
    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).delete();
      if (dailyStats[text] !== undefined) {
        delete dailyStats[text];
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      }
      loadAllData();
    } catch (err) {
      console.error("שגיאה במחיקה:", err);
    }
  }

  async function editTempHabit(id, oldText) {
    const newText = prompt("ערוך משימה:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;
    try {
      const cleanText = newText.trim();
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).update({ text: cleanText });
      if (dailyStats[oldText] !== undefined) {
        dailyStats[cleanText] = dailyStats[oldText];
        delete dailyStats[oldText];
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      }
      loadAllData();
    } catch (err) {
      console.error("שגיאה בעריכה:", err);
    }
  }

  // =====================
  // היסטוריה (14 יום)
  // =====================
  async function renderHistory() {
    if (!historyEl) return;
    try {
      const datesToShow = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        datesToShow.push(d.toISOString().split('T')[0]);
      }

      const statsSnap = await db.collection("users").doc(userId).collection("stats").get();
      const allStats = {};
      statsSnap.forEach(doc => allStats[doc.id] = doc.data());

      historyEl.innerHTML = "";

      for (const dateId of datesToShow) {
        const permanentCount = baseHabits.length;

        // שיפור: טעינת המשימות הזמניות לכל תאריך
        const tempSnap = await db.collection("users").doc(userId).collection("daily")
                                 .doc(dateId).collection("tempHabits").get();
        const dailyTempCount = tempSnap.size;

        const totalTasks = permanentCount + dailyTempCount;
        const dayStats = allStats[dateId] || {};
        const doneCount = Object.values(dayStats).filter(v => v === true).length;

        const dateParts = dateId.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
        const isToday = dateId === todayDocId;

        const div = document.createElement("div");
        div.style = "padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;";
        if (isToday) div.style.backgroundColor = "#f0f7ff";

        div.innerHTML = `
          <div>
            <span style="font-weight:bold;">${formattedDate}</span>
            ${isToday ? '<small style="color:#007bff; margin-right:5px;">(היום)</small>' : ''}
          </div>
          <div style="font-weight: 500;">
            <span style="color: ${doneCount === totalTasks && totalTasks > 0 ? '#2ecc71' : '#666'};">
              ${doneCount} מתוך ${totalTasks}
            </span>
            <span>${doneCount === totalTasks && totalTasks > 0 ? ' 🏆' : ' ✅'}</span>
          </div>
        `;
        historyEl.appendChild(div);
      }
    } catch (err) {
      console.error("שגיאה בהיסטוריה:", err);
    }
  }

  // =====================
  // התנתקות - מתוקן ל-index.html
  // =====================
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    }).catch(err => {
        console.error("שגיאה בהתנתקות:", err);
        // למקרה חירום שבו ה-Auth נכשל אך נרצה להוציא את המשתמש
        window.location.href = "index.html"; 
    });
  });
});
