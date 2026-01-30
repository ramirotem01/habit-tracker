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

  // שימוש בפורמט תאריך בטוח (YYYY-MM-DD) כדי למנוע בעיות ב-Firestore
  const now = new Date();
  const todayDocId = now.toISOString().split('T')[0]; 
  todayDateEl.textContent = now.toLocaleDateString("he-IL");

  let userId = null;
  let baseHabits = []; // כאן יאוחסנו מחרוזות הטקסט מה-DB
  let tempHabits = []; // משימות חד פעמיות
  let dailyStats = {}; // סטטוס הצ'קבוקסים

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    console.log("מחובר כ:", userId);
    loadAllData();
  });

  async function loadAllData() {
    try {
      console.log("טוען נתונים...");

      // 1. טעינת הרגלים קבועים - בדיוק כמו ב-manage.js
      const baseSnap = await db.collection("users").doc(userId).collection("habits").get();
      // אנחנו מושכים רק את ה-text מהאובייקט, כדי שנוכל להשוות אותו לסטטיסטיקה
      baseHabits = baseSnap.docs.map(doc => doc.data().text);
      console.log("הרגלים קבועים שנטענו:", baseHabits);

      // 2. טעינת משימות חד פעמיות
      const tempSnap = await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").get();
      tempHabits = tempSnap.docs.map(doc => doc.data().text);

      // 3. טעינת סטטוס הביצוע (הצ'קבוקסים)
      const statsDoc = await db.collection("users").doc(userId).collection("stats").doc(todayDocId).get();
      dailyStats = statsDoc.exists ? statsDoc.data() : {};

      render();
    } catch (err) {
      console.error("שגיאה בטעינת הנתונים:", err);
    }
  }

  function render() {
    if (!habitListEl) return;
    habitListEl.innerHTML = "";
    
    // איחוד כל המשימות לרשימה אחת
    const allTasks = [...baseHabits, ...tempHabits];
    let doneCount = 0;

    allTasks.forEach(taskText => {
      // בדיקה אם המשימה סומנה כבוצעה (לפי הטקסט שלה כמפתח)
      const isDone = dailyStats[taskText] === true;
      if (isDone) doneCount++;

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.padding = "10px";
      li.style.borderBottom = "1px solid #eee";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isDone;
      cb.style.marginLeft = "12px";
      
      cb.onchange = async () => {
        dailyStats[taskText] = cb.checked;
        // שמירת המצב החדש ל-Firestore
        await db.collection("users").doc(userId).collection("stats").doc(todayDocId).set(dailyStats);
        render(); // רינדור מחדש לעדכון המונים וקו חוצה
      };

      const span = document.createElement("span");
      span.textContent = taskText;
      if (isDone) span.style.textDecoration = "line-through";

      li.appendChild(cb);
      li.appendChild(span);
      habitListEl.appendChild(li);
    });

    // עדכון מספרי הסיכום ב-HTML
    if (totalHabitsEl) totalHabitsEl.textContent = allTasks.length;
    if (doneTodayEl) doneTodayEl.textContent = doneCount;
    if (progressTodayEl) progressTodayEl.textContent = `${doneCount}/${allTasks.length}`;
    
    renderHistory();
  }

  // הוספת משימה חד פעמית (נשמרת תחת תאריך ספציפי)
  addTempHabitBtn.addEventListener("click", async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;

    try {
      await db.collection("users").doc(userId).collection("daily")
        .doc(todayDocId).collection("tempHabits").add({ text: text });
      tempHabitInput.value = "";
      loadAllData();
    } catch (err) {
      console.error("שגיאה בהוספת משימה:", err);
    }
  });

  async function renderHistory() {
    if (!historyEl) return;
    try {
      const snap = await db.collection("users").doc(userId).collection("stats")
        .orderBy("__name__", "desc").limit(14).get();
      
      historyEl.innerHTML = "";
      snap.forEach(doc => {
        const stats = doc.data();
        const done = Object.values(stats).filter(v => v === true).length;
        const div = document.createElement("div");
        div.style.fontSize = "0.9em";
        div.style.margin = "4px 0";
        div.textContent = `${doc.id}: ${done} משימות הושלמו`;
        historyEl.appendChild(div);
      });
    } catch (err) {}
  }

  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => window.location.href = "login.html");
  });
});
