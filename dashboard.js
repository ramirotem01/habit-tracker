document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .task-text-span { cursor: pointer; display: inline-block; flex: 1; transition: all 0.2s; }
    .task-text-span.expanded { white-space: normal !important; overflow: visible !important; }
    .actions-btn { transition: transform 0.2s; border-radius: 8px; }
    .actions-btn:hover { transform: scale(1.1); background-color: rgba(0,0,0,0.05) !important; }
  `;
  document.head.appendChild(style);

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
      tasksTitle.textContent = isEn ? "My Daily Tasks" : "המשימות שלי להיום";
      if(prevDayBtn) prevDayBtn.style.visibility = "hidden";
    } else {
      tasksTitle.textContent = isEn ? "My Tasks for Tomorrow" : "המשימות שלי למחר";
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
    } catch (err) { console.error("Load error:", err); }
  }

  if(nextDayBtn) nextDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() + 1); loadAllData(); loadGratitude(); };
  if(prevDayBtn) prevDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() - 1); loadAllData(); loadGratitude(); };

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
      li.style = "background: #fffbeb; padding: 10px; border-radius: 10px; margin-bottom: 5px; border-inline-start: 4px solid #f59e0b;";
      li.textContent = text;
      gratitudeListEl.appendChild(li);
    });
    const count = items.length;
    if(gratitudeCircle) gratitudeCircle.textContent = `${count}/3`;
    const inputGroup = document.getElementById("gratitudeInputGroup");
    if(inputGroup) inputGroup.style.display = (count >= 3) ? "none" : "flex";
  }

  if(addGratitudeBtn) {
    addGratitudeBtn.onclick = async () => {
      const text = gratitudeInput.value.trim();
      if (!text) return;
      try {
        await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("gratitude").add({ text, createdAt: new Date() });
        gratitudeInput.value = "";
        loadGratitude();
      } catch (e) { console.error(e); }
    };
  }

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
      contentSide.style = "display: flex; align-items: center; flex: 1;";

      // בניית ה-Checkbox החדש (Custom Toggle)
      const customCb = document.createElement("div");
      customCb.className = isDone ? "custom-cb checked" : "custom-cb";
      
      customCb.onclick = async () => {
        const newState = !dailyStats[task.text];
        
        // לוגיקת קימה ב-06:00
        if (newState && (task.text === "קימה ב-06:00" || task.text === "Wake up at 06:00")) {
          const hour = new Date().getHours();
          if (hour < 3 || hour >= 6) {
            alert(isEn ? "Too late/early! (03:00-06:00 AM only)" : "לא בזמן! (רק בין 03:00 ל-06:00 בבוקר)");
            return;
          }
        }

        dailyStats[task.text] = newState;
        await db.collection("users").doc(userId).collection("stats").doc(viewDocId).set(dailyStats);
        if (window.syncHabitWithLeague) window.syncHabitWithLeague(task.text, newState);
        render(); 
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      span.className = isDone ? "task-text-span done" : "task-text-span";
      span.onclick = () => span.classList.toggle("expanded");

      contentSide.appendChild(customCb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      if (task.isTemp) {
        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.className = "actions-btn";
        delBtn.style = "background:none; border:none; cursor:pointer; font-size: 1.1rem; padding: 5px;";
        delBtn.onclick = () => deleteTempHabit(task.id, task.text);
        actionsSide.appendChild(delBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    if(totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if(doneTodayEl) doneTodayEl.textContent = doneCount;
    if(progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    if (taskProgressCircle) {
      const pct = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
      taskProgressCircle.textContent = pct + "%";
      taskProgressCircle.className = (pct === 100 && allTasks.length > 0) ? "task-progress-circle task-circle-done" : "task-progress-circle";
      taskProgressCircle.style.borderColor = pct === 100 ? "#10b981" : "#e2e8f0";
    }
    renderChart();
  }

  async function renderChart() {
    const ctx = document.getElementById('habitsChart');
    if (!ctx || typeof Chart === 'undefined') return;
    try {
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
        data: { labels, datasets: [{ data: dataPoints, backgroundColor: '#4f46e5', borderRadius: 8 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    } catch (e) { console.error("Chart error:", e); }
  }

  if(addTempHabitBtn) {
    addTempHabitBtn.onclick = async () => {
      const text = tempHabitInput.value.trim();
      if (!text) return;
      await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").add({ text });
      tempHabitInput.value = ""; loadAllData();
    };
  }

  if(addTomorrowHabitBtn) {
    addTomorrowHabitBtn.onclick = async () => {
      const text = tempHabitInput.value.trim();
      if (!text) return;
      const tomorrowDocId = getDocId(new Date(Date.now() + 86400000));
      await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
      alert(isEn ? `Task added for tomorrow!` : `המשימה נוספה למחר!`);
      tempHabitInput.value = "";
    };
  }

  async function deleteTempHabit(id, text) {
    if (!confirm(isEn ? `Delete "${text}"?` : `למחוק את "${text}"?`)) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).delete();
    loadAllData();
  }

  if(logoutBtn) logoutBtn.onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
