document.addEventListener("DOMContentLoaded", () => {
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

  // אלמנטים של הודיה
  const gratitudeInput = document.getElementById("gratitudeInput");
  const addGratitudeBtn = document.getElementById("addGratitudeBtn");
  const gratitudeListEl = document.getElementById("gratitudeList");
  const gratitudeCircle = document.getElementById("gratitudeCircle");

  // אלמנט עיגול התקדמות משימות
  const taskProgressCircle = document.getElementById("taskProgressCircle");

  // ניהול תאריכים
  let currentViewDate = new Date(); // התאריך שבו המשתמש צופה כרגע
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
    
    // עדכון התאריך בסיכום למעלה והכותרת
    todayDateEl.textContent = currentViewDate.toLocaleDateString("he-IL");
    
    if (viewDocId === realTodayStr) {
      tasksTitle.textContent = "🗓 המשימות שלי להיום";
      prevDayBtn.style.visibility = "hidden";
      nextDayBtn.style.visibility = "visible";
    } else {
      tasksTitle.textContent = "🗓 המשימות שלי למחר";
      prevDayBtn.style.visibility = "visible";
      nextDayBtn.style.visibility = "hidden";
    }

    try {
      // טעינת הרגלים קבועים
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));

      // טעינת משימות זמניות ליום הנבחר
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(viewDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));

      // טעינת סטטיסטיקות (ביצועים) ליום הנבחר
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(viewDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינה:", err);
    }
  }

  // חצים לניווט
  nextDayBtn.addEventListener("click", () => {
    currentViewDate.setDate(currentViewDate.getDate() + 1);
    loadAllData();
    loadGratitude(); // עדכון הודיות לתאריך החדש
  });

  prevDayBtn.addEventListener("click", () => {
    currentViewDate.setDate(currentViewDate.getDate() - 1);
    loadAllData();
    loadGratitude(); // עדכון הודיות לתאריך החדש
  });

  async function loadGratitude() {
    const viewDocId = getDocId(currentViewDate);
    const snap = await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("gratitude").get();
    const gratitudes = snap.docs.map(doc => doc.data().text);
    renderGratitude(gratitudes);
  }

  function renderGratitude(items) {
    gratitudeListEl.innerHTML = "";
    items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      gratitudeListEl.appendChild(li);
    });

    const count = items.length;
    gratitudeCircle.textContent = `${count}/3`;
    
    if (count >= 3) {
      gratitudeCircle.className = "gratitude-circle circle-full";
      document.getElementById("gratitudeInputGroup").style.display = "none";
    } else {
      gratitudeCircle.className = "gratitude-circle circle-low";
      document.getElementById("gratitudeInputGroup").style.display = "flex";
    }
  }

  addGratitudeBtn.addEventListener("click", async () => {
    const text = gratitudeInput.value.trim();
    if (!text) return;
    const viewDocId = getDocId(currentViewDate);

    try {
      await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("gratitude").add({
        text,
        createdAt: new Date()
      });
      gratitudeInput.value = "";
      loadGratitude();
    } catch (e) {
      console.error("Error adding gratitude:", e);
    }
  });

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
      contentSide.style = "display: flex; align-items: center; overflow: hidden; flex: 1; padding-left: 10px;";

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
      if (isDone) span.style.textDecoration = "line-through";

      contentSide.appendChild(cb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      actionsSide.style = "display: flex; align-items: center; flex-shrink: 0;";

      if (task.isTemp) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; margin-left:8px; padding: 5px; font-size: 16px;";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.style = "background:none; border:none; cursor:pointer; padding: 5px; font-size: 16px;";
        deleteBtn.onclick = () => deleteTempHabit(task.id, task.text);

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

    if (taskProgressCircle) {
      const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      taskProgressCircle.textContent = percent + "%";
      taskProgressCircle.className = (total > 0 && doneCount === total) ? 
        "task-progress-circle task-circle-done" : "task-progress-circle task-circle-low";
    }
    
    renderChart();
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
        dates.push(getDocId(d));
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
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          plugins: { legend: { display: false } }
        }
      });
    } catch (err) { console.error("שגיאה בגרף:", err); }
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    const viewDocId = getDocId(currentViewDate);
    await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("tempHabits").add({ text });
    tempHabitInput.value = "";
    loadAllData();
  });

  addTomorrowHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDocId = getDocId(tomorrow);
    try {
      await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
      alert(`המשימה "${text}" נוספה למחר!`);
      tempHabitInput.value = "";
      if (getDocId(currentViewDate) === tomorrowDocId) loadAllData();
    } catch (err) { console.error(err); }
  });

  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את "${text}"?`)) return;
    const viewDocId = getDocId(currentViewDate);
    await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("tempHabits").doc(id).delete();
    if (dailyStats[text] !== undefined) {
      delete dailyStats[text];
      await db.collection("users").doc(userId).collection("stats").doc(viewDocId).set(dailyStats);
    }
    loadAllData();
  }

  async function editTempHabit(id, oldText) {
    const newText = prompt("ערוך משימה:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;
    const cleanText = newText.trim();
    const viewDocId = getDocId(currentViewDate);
    await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("tempHabits").doc(id).update({ text: cleanText });
    if (dailyStats[oldText] !== undefined) {
      dailyStats[cleanText] = dailyStats[oldText];
      delete dailyStats[oldText];
      await db.collection("users").doc(userId).collection("stats").doc(viewDocId).set(dailyStats);
    }
    loadAllData();
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "index.html");
  });
});
