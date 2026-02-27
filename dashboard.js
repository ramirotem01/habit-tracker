document.addEventListener("DOMContentLoaded", () => {
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const addTomorrowHabitBtn = document.getElementById("addTomorrowHabitBtn"); 
  const tasksTitle = document.getElementById("tasksTitle");
  const prevDayBtn = document.getElementById("prevDayBtn");
  const nextDayBtn = document.getElementById("nextDayBtn");
  const gratitudeInput = document.getElementById("gratitudeInput");
  const addGratitudeBtn = document.getElementById("addGratitudeBtn");
  const gratitudeListEl = document.getElementById("gratitudeList");
  const gratitudeCircle = document.getElementById("gratitudeCircle");
  const taskProgressCircle = document.getElementById("taskProgressCircle");

  const isEn = !navigator.language.startsWith('he');
  let currentViewDate = new Date();
  const realTodayStr = new Date().toISOString().split('T')[0];
  
  function getDocId(date) { return date.toISOString().split('T')[0]; }

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};
  let myChart = null; 

  auth.onAuthStateChanged(user => {
    if (!user) { window.location.href = "index.html"; return; }
    userId = user.uid;
    loadAllData();
    loadGratitude(); 
  });

  async function loadAllData() {
    const viewDocId = getDocId(currentViewDate);
    todayDateEl.textContent = currentViewDate.toLocaleDateString(isEn ? "en-GB" : "he-IL");
    
    if (viewDocId === realTodayStr) {
      tasksTitle.textContent = isEn ? "🗓 המשימות שלי להיום" : "🗓 המשימות שלי להיום";
      if(prevDayBtn) prevDayBtn.style.visibility = "hidden";
    } else {
      tasksTitle.textContent = isEn ? "🕒 המשימות שלי למחר" : "🕒 המשימות שלי למחר";
      if(prevDayBtn) prevDayBtn.style.visibility = "visible";
    }

    try {
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));
      const tempSnap = await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(viewDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};
      render();
    } catch (err) { console.error(err); }
  }

  nextDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() + 1); loadAllData(); loadGratitude(); };
  prevDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() - 1); loadAllData(); loadGratitude(); };

  async function loadGratitude() {
    const viewDocId = getDocId(currentViewDate);
    const snap = await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("gratitude").get();
    const gratitudes = snap.docs.map(doc => doc.data().text);
    renderGratitude(gratitudes);
  }

  function renderGratitude(items) {
    if(!gratitudeListEl) return;
    gratitudeListEl.innerHTML = "";
    items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      li.onclick = () => li.classList.toggle("expanded");
      gratitudeListEl.appendChild(li);
    });
    const count = items.length;
    if(gratitudeCircle) {
        gratitudeCircle.textContent = `${count}/3`;
        gratitudeCircle.className = (count >= 3) ? "gratitude-circle circle-full" : "gratitude-circle circle-low";
    }
    document.getElementById("gratitudeInputGroup").style.display = (count >= 3) ? "none" : "flex";
  }

  addGratitudeBtn.onclick = async () => {
    const text = gratitudeInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("gratitude").add({ text, createdAt: new Date() });
    gratitudeInput.value = ""; loadGratitude();
  };

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
      contentSide.style = "display: flex; align-items: center; flex: 1; overflow: hidden;";

      const customCb = document.createElement("div");
      customCb.className = isDone ? "custom-cb checked" : "custom-cb";
      customCb.onclick = async () => {
        const newState = !dailyStats[task.text];
        if (newState && (task.text === "קימה ב-06:00" || task.text === "Wake up at 06:00")) {
          const hour = new Date().getHours();
          if (hour < 3 || hour >= 6) {
            alert(isEn ? "Only 03:00-06:00 AM!" : "רק בין 03:00 ל-06:00 בבוקר!");
            return;
          }
        }
        dailyStats[task.text] = newState;
        await db.collection("users").doc(userId).collection("stats").doc(viewDocId).set(dailyStats);
        render(); 
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      span.className = isDone ? "task-text-span done" : "task-text-span";
      span.onclick = () => span.classList.toggle("expanded");

      contentSide.appendChild(customCb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      actionsSide.style = "display: flex; align-items: center;";

      if (task.isTemp) {
        // החזרת כפתור עריכה
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = "background:none; border:none; cursor:pointer; font-size: 16px; margin-inline-start: 5px;";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.style = "background:none; border:none; cursor:pointer; font-size: 16px; margin-inline-start: 10px;";
        delBtn.onclick = () => deleteTempHabit(task.id, task.text);
        
        actionsSide.appendChild(editBtn);
        actionsSide.appendChild(delBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    // עדכון נתוני סיכום
    if(totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if(doneTodayEl) doneTodayEl.textContent = doneCount;
    if(progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    if (taskProgressCircle) {
      const pct = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
      taskProgressCircle.textContent = pct + "%";
      taskProgressCircle.className = (pct === 100 && allTasks.length > 0) ? "task-progress-circle task-circle-done" : "task-progress-circle task-circle-low";
    }
    renderChart();
  }

  async function editTempHabit(id, oldText) {
    const newText = prompt(isEn ? "Edit task:" : "ערוך משימה:", oldText);
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

  async function deleteTempHabit(id, text) {
    if (!confirm(isEn ? `Delete "${text}"?` : `למחוק את "${text}"?`)) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).delete();
    loadAllData();
  }

  async function renderChart() {
    const ctx = document.getElementById('habitsChart');
    if (!ctx || typeof Chart === 'undefined') return;
    const dates = []; const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(getDocId(d));
      labels.push(d.toLocaleDateString(isEn ? "en-GB" : "he-IL", { weekday: 'short' }));
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
      data: { labels, datasets: [{ data: dataPoints, backgroundColor: '#3498db', borderRadius: 5 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  addTempHabitBtn.onclick = async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").add({ text });
    tempHabitInput.value = ""; loadAllData();
  };

  addTomorrowHabitBtn.onclick = async () => {
      const text = tempHabitInput.value.trim();
      if (!text) return;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      await db.collection("users").doc(userId).collection("daily").doc(getDocId(tomorrow)).collection("tempHabits").add({ text });
      tempHabitInput.value = ""; alert(isEn ? "Added for tomorrow" : "נוסף למחר");
  };

  document.getElementById("logoutBtn").onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
