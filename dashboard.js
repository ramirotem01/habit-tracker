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

  // אלמנטים להכרת תודה
  const gratitudeInput = document.getElementById("gratitudeInput");
  const addGratitudeBtn = document.getElementById("addGratitudeBtn");
  const fgCircle = document.getElementById("fgCircle");
  const gratitudeCountText = document.getElementById("gratitudeCount");

  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

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
    try {
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));

      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));

      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) { console.error("Error loading habits:", err); }
  }

  // --- לוגיקת הכרת תודה ---
  async function loadGratitude() {
    if (!userId) return;
    try {
      const gratSnap = await db.collection("users").doc(userId).collection("gratitude").doc(todayDocId).get();
      const list = gratSnap.exists ? gratSnap.data().items || [] : [];
      updateGratitudeUI(list.length);
    } catch (err) { console.error(err); }
  }

  function updateGratitudeUI(count) {
    const safeCount = Math.min(count, 3);
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = (safeCount / 3) * circumference;
    
    if (fgCircle) fgCircle.style.strokeDasharray = `${offset} ${circumference}`;
    if (gratitudeCountText) gratitudeCountText.textContent = `${safeCount}/3`;
    
    if (safeCount >= 3) {
      if (gratitudeInput) { gratitudeInput.disabled = true; gratitudeInput.placeholder = "תודה על הכל! ✨"; }
      if (addGratitudeBtn) addGratitudeBtn.disabled = true;
    }
  }

  async function saveGratitude() {
    const text = gratitudeInput.value.trim();
    if (!text || !userId) return;

    try {
      const docRef = db.collection("users").doc(userId).collection("gratitude").doc(todayDocId);
      const doc = await docRef.get();
      let items = doc.exists ? doc.data().items || [] : [];
      
      if (items.length < 3) {
        items.push(text);
        await docRef.set({ items: items }, { merge: true });
        gratitudeInput.value = "";
        updateGratitudeUI(items.length);
      }
    } catch (err) { console.error(err); }
  }

  if (addGratitudeBtn) addGratitudeBtn.addEventListener("click", saveGratitude);
  if (gratitudeInput) {
    gratitudeInput.addEventListener("keypress", (e) => { if (e.key === "Enter") saveGratitude(); });
  }

  // --- ניהול הרגלים וגרף ---
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
      contentSide.style = "display: flex; align-items: center; overflow: hidden; flex: 1; padding-left: 10px;";
      
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
      actionsSide.style = "display: flex; align-items: center; flex-shrink: 0;";
      if (task.isTemp) {
        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.style = "background:none; border:none; cursor:pointer;";
        delBtn.onclick = () => deleteTempHabit(task.id, task.text);
        actionsSide.appendChild(delBtn);
      }
      li.appendChild(contentSide);
      li.appendChild(actionsSide);
      habitListEl.appendChild(li);
    });

    totalHabitsEl.textContent = allTasks.length;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    renderChart();
  }

  async function renderChart() {
    const ctx = document.getElementById('habitsChart');
    if (!ctx) return;
    try {
      const dates = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
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
          datasets: [{ label: 'משימות', data: dataPoints, backgroundColor: '#3498db', borderRadius: 5 }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
      });
    } catch (err) { console.error(err); }
  }

  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").add({ text });
    tempHabitInput.value = "";
    loadAllData();
  });

  addTomorrowHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDocId = tomorrow.toISOString().split('T')[0];
    await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
    alert("נוסף למחר!");
    tempHabitInput.value = "";
  });

  async function deleteTempHabit(id, text) {
    if (!confirm(`למחוק את "${text}"?`)) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").doc(id).delete();
    loadAllData();
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "index.html");
  });
});
