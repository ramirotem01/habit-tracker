document.addEventListener("DOMContentLoaded", () => {
  const habitListEl = document.getElementById("habitList");
  const gratitudeListEl = document.getElementById("gratitudeList");
  const gratitudeInput = document.getElementById("gratitudeInput");
  const addGratitudeBtn = document.getElementById("addGratitudeBtn");
  const fgCircle = document.getElementById("fgCircle");
  const gratitudeCountText = document.getElementById("gratitudeCount");

  const todayDocId = new Date().toISOString().split('T')[0]; 
  document.getElementById("todayDate").textContent = new Date().toLocaleDateString("he-IL");

  let userId = null;
  let dailyStats = {};

  auth.onAuthStateChanged(user => {
    if (!user) { window.location.href = "index.html"; return; }
    userId = user.uid;
    loadAllData();
    loadGratitude(); 
  });

  async function loadAllData() {
    const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
    const tempSnap = await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").get();
    const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
    
    dailyStats = statsDoc.exists ? statsDoc.data() : {};
    const baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));
    const tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));
    
    renderHabits([...baseHabits, ...tempHabits]);
  }

  // --- לוגיקת הודיה (1. שמירה, 2. הצגה, 3. שעון) ---
  async function loadGratitude() {
    if (!userId) return;
    const gratSnap = await db.collection("users").doc(userId).collection("gratitude").doc(todayDocId).get();
    const items = gratSnap.exists ? gratSnap.data().items || [] : [];
    renderGratitudeItems(items);
  }

  function renderGratitudeItems(items) {
    gratitudeListEl.innerHTML = "";
    items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = "• " + text;
      gratitudeListEl.appendChild(li);
    });

    const count = items.length;
    const safeCount = Math.min(count, 3);
    const circumference = 157; // 2 * PI * 25
    const offset = circumference - (safeCount / 3) * circumference;
    
    if (fgCircle) fgCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    if (fgCircle) fgCircle.style.strokeDashoffset = offset;
    if (gratitudeCountText) gratitudeCountText.textContent = `${safeCount}/3`;

    if (safeCount >= 3) {
      gratitudeInput.disabled = true;
      addGratitudeBtn.disabled = true;
      gratitudeInput.placeholder = "תודה על הכל! ✨";
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
        await docRef.set({ items }, { merge: true }); // 1. שמירה ב-DB
        gratitudeInput.value = "";
        renderGratitudeItems(items); // 2+3. הצגה וקידום השעון
      }
    } catch (err) { console.error("Error saving gratitude:", err); }
  }

  addGratitudeBtn.onclick = saveGratitude;
  gratitudeInput.onkeypress = (e) => { if (e.key === "Enter") saveGratitude(); };

  // --- ניהול הרגלים ---
  function renderHabits(allTasks) {
    habitListEl.innerHTML = "";
    let doneCount = 0;
    allTasks.forEach(task => {
      const isDone = dailyStats[task.text] === true;
      if (isDone) doneCount++;
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display:flex; align-items:center; flex:1;">
          <input type="checkbox" ${isDone ? 'checked' : ''}>
          <span style="${isDone ? 'text-decoration:line-through' : ''}">${task.text}</span>
        </div>
      `;
      li.querySelector('input').onchange = async (e) => {
        dailyStats[task.text] = e.target.checked;
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        loadAllData();
      };
      habitListEl.appendChild(li);
    });
    document.getElementById("totalHabits").textContent = allTasks.length;
    document.getElementById("doneToday").textContent = doneCount;
    document.getElementById("progressToday").textContent = `${doneCount}/${allTasks.length}`;
  }

  document.getElementById("addTempHabitBtn").onclick = async () => {
    const text = document.getElementById("tempHabitInput").value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").add({ text });
    document.getElementById("tempHabitInput").value = "";
    loadAllData();
  };

  document.getElementById("logoutBtn").onclick = () => {
    auth.signOut().then(() => window.location.href = "index.html");
  };
});
