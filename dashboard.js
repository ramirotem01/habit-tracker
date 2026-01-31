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

  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = [];
  let tempHabits = []; // עכשיו נשמור כאן אובייקטים: {id, text}
  let dailyStats = {};

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    loadAllData();
  });

  async function loadAllData() {
    try {
      // 1. טעינת הרגלים קבועים
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));

      // 2. טעינת משימות חד פעמיות (כולל ה-ID שלהן)
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

  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      li.className = "habit-item"; // הוספת קלאס לעיצוב קל ב-CSS
      li.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;";

      // צד ימין: טקסט וצ'קבוקס
      const rightSide = document.createElement("div");
      rightSide.style.display = "flex";
      rightSide.style.alignItems = "center";
      rightSide.style.gap = "10px";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.onchange = async () => {
        dailyStats[task.text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render();
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      if (isDone) span.style.textDecoration = "line-through";

      rightSide.appendChild(cb);
      rightSide.appendChild(span);

      // צד שמאל: כפתורי עריכה/מחיקה (רק למשימות זמניות)
      const actions = document.createElement("div");
      if (task.isTemp) {
        // כפתור עריכה
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; margin-left:5px;";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        // כפתור מחיקה
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.style = "background:none; border:none; cursor:pointer;";
        deleteBtn.onclick = () => deleteTempHabit(task.id, task.text);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
      }

      li.appendChild(rightSide);
      li.appendChild(actions);
      habitListEl.appendChild(li);
    });

    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    renderHistory();
  }

  // פונקציית מחיקה
  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את המשימה "${text}"?`)) return;
    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).delete();
      
      // הסרת סטטוס הביצוע מהסטטיסטיקה כדי שלא יספר
      delete dailyStats[text];
      await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      
      loadAllData();
    } catch (err) {
      console.error("שגיאה במחיקה:", err);
    }
  }

  // פונקציית עריכה
  async function editTempHabit(id, oldText) {
    const newText = prompt("ערוך משימה:", oldText);
    if (!newText || newText === oldText) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").doc(id).update({ text: newText });
      
      // עדכון הסטטיסטיקה אם השם השתנה
      if (dailyStats[oldText] !== undefined) {
        dailyStats[newText] = dailyStats[oldText];
        delete dailyStats[oldText];
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
      }

      loadAllData();
    } catch (err) {
      console.error("שגיאה בעריכה:", err);
    }
  }

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

  // ... (שאר הקוד של renderHistory ו-logout ללא שינוי)
  async function renderHistory() {
      if (!historyEl) return;
      const snap = await db.collection("users").doc(userId).collection("stats").orderBy("__name__", "desc").limit(14).get();
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
          div.innerHTML = `<span style="font-weight:bold;">${formattedDate}</span><span style="color: #2ecc71;">${doneCount} בוצעו ✅</span>`;
          historyEl.appendChild(div);
      });
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });
});
