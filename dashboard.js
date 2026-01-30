document.addEventListener("DOMContentLoaded", () => {
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const historyEl = document.getElementById("history");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // הגדרת תאריך היום - פורמט YYYY-MM-DD הוא היחיד שבטוח לשימוש כשם מסמך ב-Firebase
  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};

  // =====================
  // בדיקת חיבור משתמש
  // =====================
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    console.log("מחובר כ:", userId);
    loadAllData();
  });

  // =====================
  // טעינת כל הנתונים מה-DB
  // =====================
  async function loadAllData() {
    try {
      // 1. טעינת הרגלים קבועים (מהקולקציה שדף הניהול מעדכן)
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      baseHabits = baseSnap.docs.map(doc => doc.data().text);

      // 2. טעינת משימות חד פעמיות להיום
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => doc.data().text);

      // 3. טעינת סטטוס הביצוע (V) מקולקציית stats
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינת הנתונים:", err);
    }
  }

  // =====================
  // הצגת הנתונים במסך
  // =====================
  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(taskText => {
      const isDone = dailyStats[taskText] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.padding = "10px";
      li.style.borderBottom = "1px solid #eee";

      const span = document.createElement("span");
      span.textContent = taskText;
      if (isDone) span.style.textDecoration = "line-through";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.style.transform = "scale(1.2)";
      
      cb.onchange = async () => {
        dailyStats[taskText] = cb.checked;
        // שמירה ל-Firestore בתוך קולקציית stats
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); // עדכון המונים ועיצוב מיידי
      };

      li.appendChild(span);
      li.appendChild(cb);
      habitListEl.appendChild(li);
    });

    // עדכון מספרי הסיכום (הסטטיסטיקה של היום)
    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    renderHistory();
  }

  // =====================
  // הוספת משימה חד פעמית
  // =====================
  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text: text });
      tempHabitInput.value = "";
      loadAllData(); // טעינה מחדש של הכל כדי לעדכן את הרשימה
    } catch (err) {
      console.error("שגיאה בהוספת משימה:", err);
    }
  });

  // =====================
  // הצגת היסטוריה (14 יום)
  // =====================
  async function renderHistory() {
    if (!historyEl) return;
    try {
      const snap = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      
      if (snap.empty) {
        historyEl.innerHTML = "<div style='color:gray; padding:10px;'>אין עדיין נתונים בהיסטוריה</div>";
        return;
      }

      snap.forEach(doc => {
        const statsData = doc.data(); 
        const doneCount = Object.values(statsData).filter(v => v === true).length;
        
        const div = document.createElement("div");
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #f0f0f0";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        
        // הפיכת התאריך (2024-05-21) לתצוגה יפה (21/05)
        const dateParts = doc.id.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : doc.id;

        div.innerHTML = `
          <span style="font-weight:bold;">${formattedDate}</span>
          <span style="color: #2ecc71;">${doneCount} הרגלים בוצעו ✅</span>
        `;
        
        historyEl.appendChild(div);
      });
    } catch (err) {
      console.error("שגיאה בטעינת היסטוריה:", err);
    }
  }

  // כפתור התנתקות
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });

  // פונקציית ניווט למסך ניהול
  window.goManage = () => {
    window.location.href = "manage.html";
  };
});
