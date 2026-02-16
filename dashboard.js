document.addEventListener("DOMContentLoaded", () => {
  // ... (כל האלמנטים נשארים אותו דבר)
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const addTomorrowHabitBtn = document.getElementById("addTomorrowHabitBtn"); 
  const logoutBtn = document.getElementById("logoutBtn");
  const tasksTitle = document.getElementById("tasksTitle");
  const prevDayBtn = document.getElementById("prevDayBtn");
  const nextDayBtn = document.getElementById("nextDayBtn");

  // זיהוי שפה
  const isEn = !navigator.language.startsWith('he');

  let currentViewDate = new Date();
  const realTodayStr = new Date().toISOString().split('T')[0];
  
  function getDocId(date) {
    return date.toISOString().split('T')[0];
  }

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};
  let myChart = null; 

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    userId = user.uid;
    loadAllData();
    loadGratitude(); 
  });

  async function loadAllData() {
    const viewDocId = getDocId(currentViewDate);
    
    // פורמט תאריך לפי שפה
    todayDateEl.textContent = currentViewDate.toLocaleDateString(isEn ? "en-GB" : "he-IL");
    
    if (viewDocId === realTodayStr) {
      tasksTitle.textContent = isEn ? "🗓 My Daily Tasks" : "🗓 המשימות שלי להיום";
      prevDayBtn.style.visibility = "hidden";
      nextDayBtn.style.visibility = "visible";
    } else {
      tasksTitle.textContent = isEn ? "🗓 My Tasks for Tomorrow" : "🗓 המשימות שלי למחר";
      prevDayBtn.style.visibility = "visible";
      nextDayBtn.style.visibility = "hidden";
    }

    try {
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));

      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(viewDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));

      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(viewDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  // ... (פונקציות הניווט וההודיה נשארות זהות, רק להחליף טקסטים קבועים במידת הצורך)

  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    const viewDocId = getDocId(currentViewDate);
    
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      const contentSide = document.createElement("div");
      
      // שימוש ב-margin-inline-end במקום padding-left להתאמה לשפות
      contentSide.style = "display: flex; align-items: center; overflow: hidden; flex: 1; margin-inline-end: 10px;";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.onchange = async () => {
        dailyStats[task.text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(viewDocId).set(dailyStats);
        render(); 
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      span.className = "task-text-span"; 
      if (isDone) span.style.textDecoration = "line-through";
      
      // זה הקוד שפותח את הטקסט - ודא שהוא קיים!
      span.onclick = () => span.classList.toggle("expanded");

      contentSide.appendChild(cb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      actionsSide.style = "display: flex; align-items: center; flex-shrink: 0;";

      if (task.isTemp) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; margin-inline-start:8px; padding: 5px; font-size: 16px;";
        editBtn.onclick = (e) => {
          e.stopPropagation();
          editTempHabit(task.id, task.text);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.style = "background:none; border:none; cursor:pointer; padding: 5px; font-size: 16px;";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteTempHabit(task.id, task.text);
        };

        actionsSide.appendChild(editBtn);
        actionsSide.appendChild(deleteBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    const total = allTasks.length;
    if (totalHabitsEl) totalHabitsEl.textContent = total;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${total}`;

    // ... (יתר הפונקציות כמו ה-Chart וה-Delete נשארות כפי שהן)
  }
  
  // תיקון קטן לפרומפטים בניהול משימות זמניות
  async function deleteTempHabit(id, text) {
    const confirmMsg = isEn ? `Delete "${text}"?` : `למחוק את "${text}"?`;
    if (!confirm(confirmMsg)) return;
    // ... המשך פונקציה זהה
  }

  // ... (כל שאר הקוד זהה לגיבוי שלך)
});
