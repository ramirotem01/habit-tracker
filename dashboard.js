document.addEventListener("DOMContentLoaded", () => {
  // --- הזרקת CSS לתיקון פתיחת השורות ---
  const style = document.createElement('style');
  style.innerHTML = `
    .task-text-span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; display: inline-block; flex: 1; transition: all 0.2s; }
    .task-text-span.expanded { white-space: normal !important; overflow: visible !important; }
  `;
  document.head.appendChild(style);

  // אלמנטים
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
      tasksTitle.textContent = isEn ? "🗓 My Tasks" : "🗓 המשימות שלי להיום";
      if(prevDayBtn) prevDayBtn.style.visibility = "hidden";
      if(nextDayBtn) nextDayBtn.style.visibility = "visible";
    } else {
      tasksTitle.textContent = isEn ? "🗓 Tomorrow's Tasks" : "🗓 המשימות שלי למחר";
      if(prevDayBtn) prevDayBtn.style.visibility = "visible";
      if(nextDayBtn) nextDayBtn.style.visibility = "hidden";
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

  // חצים
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
      li.textContent = text;
      li.onclick = () => li.classList.toggle("expanded");
      gratitudeListEl.appendChild(li);
    });
    const count = items.length;
    if(gratitudeCircle) {
        gratitudeCircle.textContent = `${count}/3`;
        gratitudeCircle.className = (count >= 3) ? "gratitude-circle circle-full" : "gratitude-circle circle-low";
    }
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
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;
      const li = document.createElement("li");
      const contentSide = document.createElement("div");
      contentSide.style = "display: flex; align-items: center; overflow: hidden; flex: 1; padding-inline-start: 10px;";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.onchange = async () => {
        dailyStats[task.text] = cb.checked;
        await db.collection("users").doc(userId).collection("stats").doc(getDocId(currentViewDate)).set(dailyStats);
        render(); 
      };

      const span = document.createElement("span");
      span.textContent = task.text;
      span.className = "task-text-span";
      if (isDone) span.style.textDecoration = "line-through";
      span.onclick = (e) => { e.stopPropagation(); span.classList.toggle("expanded"); };

      contentSide.appendChild(cb);
      contentSide.appendChild(span);

      const actionsSide = document.createElement("div");
      actionsSide.style = "display: flex; align-items: center; flex-shrink: 0;";

      if (task.isTemp) {
        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.style = "background:none; border:none; cursor:pointer; font-size: 16px; margin-inline-start: 8px;";
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
        data: { labels, datasets: [{ data: dataPoints, backgroundColor: '#3498db' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDocId = getDocId(tomorrow);
      try {
        await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
        alert(isEn ? `Added for tomorrow!` : `נוסף למחר!`);
        tempHabitInput.value = "";
        if (getDocId(currentViewDate) === tomorrowDocId) loadAllData();
      } catch (err) { console.error(err); }
    };
  }

  async function deleteTempHabit(id, text) {
    if (!confirm(isEn ? "Delete?" : "למחוק?")) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).delete();
    loadAllData();
  }

  if(logoutBtn) logoutBtn.onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
