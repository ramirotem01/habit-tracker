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

  // אלמנטים של הכרת תודה
  const gratitudeInput = document.getElementById("gratitudeInput");
  const addGratitudeBtn = document.getElementById("addGratitudeBtn");
  const fgCircle = document.getElementById("fgCircle");
  const gratitudeCountText = document.getElementById("gratitudeCount");
  
  // יצירת אלמנט לרשימת ההודיות (אם לא קיים ב-HTML)
  let gratitudeListEl = document.getElementById("gratitudeList");
  if (!gratitudeListEl) {
    gratitudeListEl = document.createElement("ul");
    gratitudeListEl.id = "gratitudeList";
    gratitudeListEl.style = "list-style:none; padding:10px 0 0 0; margin:0; font-size:0.9em; color:#7d6608;";
    document.querySelector(".gratitude-card div:last-child").appendChild(gratitudeListEl);
  }

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
      const tempSnap = await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};
      render();
    } catch (err) { console.error("שגיאה בטעינה:", err); }
  }

  // --- לוגיקת הכרת תודה משופרת ---
  async function loadGratitude() {
    if (!userId) return;
    try {
      const gratSnap = await db.collection("users").doc(userId).collection("gratitude").doc(todayDocId).get();
      const items = gratSnap.exists ? gratSnap.data().items || [] : [];
      renderGratitude(items);
    } catch (err) { console.error("שגיאה בטעינת הכרת תודה:", err); }
  }

  function renderGratitude(items) {
    const count = items.length;
    const safeCount = Math.min(count, 3);
    
    // 1. עדכון רשימת הטקסטים
    gratitudeListEl.innerHTML = items.map(text => `<li style="border-bottom: 1px dashed #f9e79f; padding: 3px 0;">✨ ${text}</li>`).join('');

    // 2. קידום השעון (תיקון נוסחה)
    const circumference = 157; 
    const offset = circumference - (safeCount / 3) * circumference;
    if (fgCircle) {
      fgCircle.style.strokeDasharray = `${circumference}`;
      fgCircle.style.strokeDashoffset = offset;
    }
    if (gratitudeCountText) gratitudeCountText.textContent = `${safeCount}/3`;

    // 3. חסימה אם סיים 3
    if (safeCount >= 3) {
      gratitudeInput.disabled = true;
      addGratitudeBtn.disabled = true;
      gratitudeInput.placeholder = "כל הכבוד! נתראה מחר ✨";
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
        await docRef.set({ items }, { merge: true }); // שמירה ב-DB
        gratitudeInput.value = "";
        renderGratitude(items); // הצגה וקידום השעון מיד
      }
    } catch (err) { console.error("שגיאה בשמירה:", err); }
  }

  if (addGratitudeBtn) addGratitudeBtn.onclick = saveGratitude;
  if (gratitudeInput) {
    gratitudeInput.onkeypress = (e) => { if (e.key === "Enter") saveGratitude(); };
  }

  // --- שאר הפונקציות (ללא שינוי) ---
  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;
    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;
      const li = document.createElement("li");
      li.style = "display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #eee;";
      li.innerHTML = `
        <div style="display:flex; align-items:center;">
          <input type="checkbox" ${isDone ? 'checked' : ''} style="margin-left:10px;">
          <span style="${isDone ? 'text-decoration:line-through; color:gray;' : ''}">${task.text}</span>
        </div>
      `;
      li.querySelector('input').onchange = async (e) => {
        dailyStats[task.text] = e.target.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); 
      };
      habitListEl.appendChild(li);
    });
    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    renderChart();
  }

  async function renderChart() {
    const ctx = document.getElementById('habitsChart');
    if (!ctx) return;
    try {
      const dates = []; const labels = [];
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

  addTempHabitBtn.onclick = async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").add({ text });
    tempHabitInput.value = "";
    loadAllData();
  };

  addTomorrowHabitBtn.onclick = async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDocId = tomorrow.toISOString().split('T')[0];
    await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
    alert(`נוסף למחר: ${text}`);
    tempHabitInput.value = "";
  };

  logoutBtn.onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
