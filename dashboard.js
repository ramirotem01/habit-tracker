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
    loadUserGoal(userId);
    loadAllData();
    loadGratitude(); 
  });

  async function loadUserGoal(uid) {
    const snap = await db.collection("users").doc(uid).collection("goals").orderBy("createdAt", "desc").limit(1).get();
    if (!snap.empty) {
      document.getElementById("userGoalText").textContent = `"${snap.docs[0].data().text}"`;
      document.getElementById("goalSection").style.display = "block";
    }
  }

  async function loadAllData() {
    const viewDocId = getDocId(currentViewDate);
    todayDateEl.textContent = currentViewDate.toLocaleDateString(isEn ? "en-GB" : "he-IL");
    
    tasksTitle.textContent = (viewDocId === realTodayStr) ? (isEn ? "🗓 Tasks for Today" : "🗓 המשימות שלי להיום") : (isEn ? "🕒 Tasks for Tomorrow" : "🕒 המשימות שלי למחר");
    if(prevDayBtn) prevDayBtn.style.visibility = (viewDocId === realTodayStr) ? "hidden" : "visible";

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

  function updateCircleColor(el, current, max) {
    if (!el) return;
    const pct = max > 0 ? (current / max) * 100 : 0;
    const hue = 45 + (pct * 1); 
    el.style.borderColor = `hsl(${hue}, 70%, 50%)`;
    el.style.color = `hsl(${hue}, 80%, 30%)`;
    el.textContent = el.id === "gratitudeCircle" ? `${current}/${max}` : `${Math.round(pct)}%`;
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
      contentSide.className = "task-content";

      const customCb = document.createElement("div");
      customCb.className = isDone ? "custom-cb checked" : "custom-cb";
      customCb.onclick = async () => {
        dailyStats[task.text] = !dailyStats[task.text];
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
      actionsSide.style = "display: flex; flex-shrink: 0;";

      if (task.isTemp) {
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.className = "action-icon-btn";
        editBtn.onclick = () => editTempHabit(task.id, task.text);

        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.className = "action-icon-btn";
        delBtn.onclick = () => deleteTempHabit(task.id, task.text);
        
        actionsSide.appendChild(editBtn);
        actionsSide.appendChild(delBtn);
      }

      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    totalHabitsEl.textContent = allTasks.length;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    updateCircleColor(taskProgressCircle, doneCount, allTasks.length);
    renderChart();
  }

  async function loadGratitude() {
    const viewDocId = getDocId(currentViewDate);
    const snap = await db.collection("users").doc(userId).collection("daily").doc(viewDocId).collection("gratitude").get();
    const gratitudes = snap.docs.map(doc => doc.data().text);
    gratitudeListEl.innerHTML = "";
    gratitudes.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      li.onclick = () => li.classList.toggle("expanded");
      gratitudeListEl.appendChild(li);
    });
    updateCircleColor(gratitudeCircle, gratitudes.length, 3);
    document.getElementById("gratitudeInputGroup").style.display = (gratitudes.length >= 3) ? "none" : "flex";
  }

  async function editTempHabit(id, oldText) {
    const newText = prompt(isEn ? "Edit:" : "ערוך:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).update({ text: newText.trim() });
    loadAllData();
  }

  async function deleteTempHabit(id, text) {
    if (!confirm(isEn ? "Delete?" : "למחוק?")) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).delete();
    loadAllData();
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
      tempHabitInput.value = ""; alert(isEn ? "Scheduled for tomorrow" : "תוזמן למחר");
  };

  nextDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() + 1); loadAllData(); loadGratitude(); };
  prevDayBtn.onclick = () => { currentViewDate.setDate(currentViewDate.getDate() - 1); loadAllData(); loadGratitude(); };
  
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

  addGratitudeBtn.onclick = async () => {
    const text = gratitudeInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("gratitude").add({ text, createdAt: new Date() });
    gratitudeInput.value = ""; loadGratitude();
  };

  document.getElementById("logoutBtn").onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
