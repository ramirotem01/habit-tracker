document.addEventListener("DOMContentLoaded", () => {
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};
  let myChart = null; // משתנה לשמירת האובייקט של הגרף

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
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));

      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));

      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינה:", err);
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
      li.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;";

      const contentSide = document.createElement("div");
      contentSide.style = "display: flex; align-items: center; gap: 10px;";

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
    
    renderChart(); // קריאה לגרף במקום לרשימה
  }

  async function renderChart() {
    const ctx = document.getElementById('habitsChart');
    if (!ctx) return;

    try {
      const dates = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
        labels.push(d.toLocaleDateString("he-IL", { weekday: 'short' }));
      }

      const statsSnap = await db.collection("users").doc(userId).collection("stats").get();
      const allStats = {};
      statsSnap.forEach(doc => allStats[doc.id] = doc.data());

      const dataPoints = dates.map(dateId => {
        const dayData = allStats[dateId] || {};
        return Object.values(dayData).filter(v => v === true).length;
      });

      if (myChart) myChart.destroy();
      myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'משימות שבוצעו',
            data: dataPoints,
            backgroundColor: '#3498db',
            borderColor: '#2980b9',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } }
          },
          plugins: { legend: { display: false } }
        }
      });
    } catch (err) {
      console.error("שגיאה בגרף:", err);
    }
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").add({ text });
    tempHabitInput.value = "";
    loadAllData();
  });

  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את "${text}"?`)) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").doc(id).delete();
    if (dailyStats[text] !== undefined) {
      delete dailyStats[text];
      await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
    }
    loadAllData();
  }

  async function editTempHabit(id, oldText) {
    const newText = prompt("ערוך משימה:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;
    const cleanText = newText.trim();
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").doc(id).update({ text: cleanText });
    if (dailyStats[oldText] !== undefined) {
      dailyStats[cleanText] = dailyStats[oldText];
      delete dailyStats[oldText];
      await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
    }
    loadAllData();
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "index.html");
  });
});
