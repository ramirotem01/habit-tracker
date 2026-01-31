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
  let tempHabits = []; // משימות חד פעמיות
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
  // טעינת כל הנתונים
  // =====================
  async function loadAllData() {
    try {
      // 1. טעינת הרגלים קבועים
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({
        text: doc.data().text,
        isTemp: false
      }));

      // 2. טעינת משימות חד פעמיות
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        isTemp: true
      }));

      // 3. טעינת סטטוס הביצוע
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינת הנתונים:", err);
    }
  }

  // =====================
  // הצגת הנתונים במסך
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

      // צד ימין: צ'קבוקס וטקסט
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

      // צד שמאל: כפתורי פעולה (רק למשימות זמניות)
      const actionsSide = document.createElement("div");
      
      if (task.isTemp) {
        // כפתור עריכה
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; font-size: 16px; margin-left: 8px;";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        // כפתור מחיקה
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.style = "background:none; border:none; cursor:pointer; font-size: 16px;";
        deleteBtn.onclick = () => deleteTempHabit(task.id, task.text);

        actionsSide.appendChild(editBtn);
        actionsSide.appendChild(deleteBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    // עדכון מונים
    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    renderHistory();
  }

  // =====================
  // פונקציות ניהול משימות זמניות
  // =====================

  // הוספה
  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text: text });
      tempHabitInput.value = "";
      loadAllData(); 
    } catch (err) {
      console.error("שגיאה בהוספת משימה:", err);
    }
  });

  // מחיקה
  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את המשימה "${text}"?`)) return;
    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).delete();
      
      // ניקוי הסטטוס מה-Stats אם קיים
      if (dailyStats[text] !== undefined) {
        delete dailyStats[text];
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      }
      loadAllData();
    } catch (err) {
      console.error("שגיאה במחיקה:", err);
    }
  }

  // עריכה
  async function editTempHabit(id, oldText) {
    const newText = prompt("ערוך את המשימה:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).update({ text: newText.trim() });
      
      // עדכון השם בסטטיסטיקה אם כבר סומן ב-V
      if (dailyStats[oldText] !== undefined) {
        dailyStats[newText.trim()] = dailyStats[oldText];
        delete dailyStats[oldText];
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      }
      loadAllData();
    } catch (err) {
      console.error("שגיאה בעריכה:", err);
    }
  }

  // =====================
  // היסטוריה וניתוק
  // =====================
  async function renderHistory() {
    if (!historyEl) return;
    try {
      const snap = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      if (snap.empty) {
        historyEl.innerHTML = "<div style='color:gray; padding:10px;'>אין עדיין נתונים</div>";
        return;
      }

      snap.forEach(doc => {
        const statsData = doc.data(); 
        const doneCount = Object.values(statsData).filter(v => v === true).length;
        const dateParts = doc.id.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : doc.id;

        const div = document.createElement("div");
        div.style = "padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between;";
        div.innerHTML = `
          <span style="font-weight:bold;">${formattedDate}</span>
          <span style="color: #2ecc71;">${doneCount} בוצעו ✅</span>
        `;
        historyEl.appendChild(div);
      });
    } catch (err) {
      console.error("שגיאה בטעינת היסטוריה:", err);
    }
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });
});
