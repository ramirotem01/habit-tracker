// משתנים גלובליים כדי שה-HTML יוכל לגשת לפונקציות
let userId = null;
const now = new Date();
const todayDocId = now.toISOString().split('T')[0];

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    userId = user.uid;
    document.getElementById("todayDate").textContent = now.toLocaleDateString("he-IL");
    loadAllData();
    loadGratitudeUI(); // טעינה ראשונית של המצב מה-DB
  });
});

// פונקציית הקסם - נקראת בלחיצה על ה- +
async function saveGratitudeNow() {
  const input = document.getElementById("gratitudeInput");
  const text = input.value.trim();
  
  if (!text || !userId) return;

  try {
    const docRef = db.collection("users").doc(userId).collection("gratitude").doc(todayDocId);
    const doc = await docRef.get();
    let items = doc.exists ? doc.data().items || [] : [];

    if (items.length < 3) {
      items.push(text);
      await docRef.set({ items: items, lastUpdate: new Date() }, { merge: true });
      
      input.value = ""; // ניקוי השדה
      updateGratitudeCircle(items.length); // עדכון ויזואלי
      console.log("נשמר בהצלחה!");
    } else {
      alert("כבר הזנת 3 הודיות היום!");
    }
  } catch (error) {
    console.error("שגיאה בשמירה:", error);
  }
}

// טעינת המצב הקיים מה-DB כשהדף נפתח
async function loadGratitudeUI() {
  if (!userId) return;
  const doc = await db.collection("users").doc(userId).collection("gratitude").doc(todayDocId).get();
  if (doc.exists) {
    updateGratitudeCircle(doc.data().items.length);
  }
}

// עדכון העיגול והטקסט
function updateGratitudeCircle(count) {
  const safeCount = Math.min(count, 3);
  const circumference = 157; // 2 * PI * 25
  const offset = circumference - (safeCount / 3) * circumference;
  
  const fgCircle = document.getElementById("fgCircle");
  const countText = document.getElementById("gratitudeCount");
  const btn = document.getElementById("addGratitudeBtn");
  const input = document.getElementById("gratitudeInput");

  if (fgCircle) fgCircle.style.strokeDashoffset = offset;
  if (countText) countText.textContent = `${safeCount}/3`;

  if (safeCount >= 3) {
    input.disabled = true;
    btn.disabled = true;
    input.placeholder = "הודית על 3 דברים היום! ✨";
  }
}

// --- שאר הפונקציות של המערכת (הרגלים וגרפים) ---

async function loadAllData() {
  // כאן נשאר הקוד המקורי שלך לטעינת הרגלים
  const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
  const baseHabits = baseSnap.docs.map(doc => ({ text: doc.data().text, isTemp: false }));
  
  const tempSnap = await db.collection("users").doc(userId).collection("daily").doc(todayDocId).collection("tempHabits").get();
  const tempHabits = tempSnap.docs.map(doc => ({ id: doc.id, text: doc.data().text, isTemp: true }));

  const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
  const dailyStats = statsDoc.exists ? statsDoc.data() : {};

  renderHabits(baseHabits, tempHabits, dailyStats);
}

function renderHabits(base, temp, stats) {
  const list = document.getElementById("habitList");
  if (!list) return;
  list.innerHTML = "";
  const all = [...base, ...temp];
  
  all.forEach(task => {
    const isDone = stats[task.text] === true;
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox" ${isDone ? 'checked' : ''}> <span>${task.text}</span>`;
    list.appendChild(li);
  });
  
  document.getElementById("totalHabits").textContent = all.length;
}

// כפתור התנתקות
document.getElementById("logoutBtn").onclick = () => auth.signOut().then(() => window.location.href = "index.html");
