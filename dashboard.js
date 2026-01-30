const habitListEl = document.getElementById("habitList");
const tempHabitListEl = document.getElementById("tempHabitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");
const tempHabitInput = document.getElementById("tempHabitInput");
const addTempBtn = document.getElementById("addTempBtn");
const logoutBtn = document.getElementById("logoutBtn");
const logDiv = document.getElementById("logDiv");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let userId = null;
let baseHabits = [];
let tempHabits = [];
let dailyStats = {};

// פונקציה להדפסת לוג
function log(msg) {
  console.log(msg);
  if(logDiv) logDiv.textContent += msg + "\n";
}

// בדיקה אם המשתמש מחובר
auth.onAuthStateChanged(user => {
  if (!user) {
    log("אין משתמש מחובר, מעבר לדף התחברות");
    window.location.href = "index.html";
    return;
  }
  userId = user.uid;
  log("משתמש מחובר! userId: " + userId);
  loadAll();
});

// טען את כל הנתונים
function loadAll() {
  log("טוען את כל הנתונים מה-Firestore...");
  Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()])
    .then(render)
    .catch(err => log("שגיאה בטעינת נתונים: " + err.message));
}

// טען הרגלים קבועים מה-Firestore
function loadBaseHabits() {
  log("טוען הרגלים קבועים...");
  return db.collection("users")
    .doc(userId)
    .collection("habits")
    .get()
    .then(snap => {
      baseHabits = snap.docs.map(d => d.data().text);
      log("טעון הרגלים קבועים: " + baseHabits.join(", "));
    })
    .catch(err => log("שגיאה בטעינת הרגלים קבועים: " + err.message));
}

// טען הרגלים זמניים יומיים
function loadTempHabits() {
  log("טוען הרגלים זמניים...");
  return db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .get()
    .then(snap => {
      tempHabits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      log("טעון הרגלים זמניים: " + tempHabits.map(h => h.text).join(", "));
    })
    .catch(err => log("שגיאה בטעינת הרגלים זמניים: " + err.message));
}

// טען סטטיסטיקה יומית
function loadDailyStats() {
  log("טוען סטטיסטיקה יומית...");
  return db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .get()
    .then(doc => {
      dailyStats = doc.exists ? doc.data() : {};
      log("טעון סטטיסטיקה יומית: " + JSON.stringify(dailyStats));
    })
    .catch(err => log("שגיאה בטעינת סטטיסטיקה: " + err.message));
}

// Toggle checkbox
function toggleHabit(name, value) {
  dailyStats[name] = value;
  db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .set(dailyStats)
    .then(() => {
      log("סטטוס הרגל עודכן: " + name + " = " + value);
      render();
    })
    .catch(err => log("שגיאה בעדכון סטטוס: " + err.message));
}

// הוסף משימה חד פעמית
function addTempHabit() {
  const text = tempHabitInput.value.trim();
  if (!text) return;
  log("מנסה להוסיף משימה חד פעמית: " + text);
  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .add({ text })
    .then(() => {
      log("המשימה נוספה בהצלחה!");
      tempHabitInput.value = "";
      loadAll();
    })
    .catch(err => log("שגיאה בהוספת משימה: " + err.message));
}

// מחיקת משימה זמנית
function deleteTempHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .doc(id)
    .delete()
    .then(() => {
      log("משימה זמנית נמחקה: " + id);
      loadAll();
    })
    .catch(err => log("שגיאה במחיקה: " + err.message));
}

// Render הדשבורד
function render() {
  habitListEl.innerHTML = "";
  tempHabitListEl.innerHTML = "";

  let done = 0;
  const all = [...baseHabits, ...tempHabits.map(h => h.text)];

  // הרגלים קבועים
  baseHabits.forEach(text => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => toggleHabit(text, cb.checked);
    li.append(text, cb);
    habitListEl.appendChild(li);
    if(cb.checked) done++;
  });

  // הרגלים זמניים
  tempHabits.forEach(h => {
    const li = document.createElement("li");
    li.textContent = "🕒 " + h.text;

    const edit = document.createElement("button");
    edit.textContent = "✏";
    edit.onclick = () => {
      const updated = prompt("עדכן משימה:", h.text);
      if(updated) {
        db.collection("users")
          .doc(userId)
          .collection("daily")
          .doc(today)
          .collection("tempHabits")
          .doc(h.id)
          .update({ text: updated })
          .then(() => {
            log("משימה עודכנה בהצלחה!");
            loadAll();
          })
          .catch(err => log("שגיאה בעדכון משימה: " + err.message));
      }
    };

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = () => deleteTempHabit(h.id);

    li.append(edit, del);
    tempHabitListEl.appendChild(li);
  });

  totalHabitsEl.textContent = all.length;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${all.length}`;

  renderHistory();
}

// Render היסטוריית 14 יום
function renderHistory() {
  if(!historyEl) return;

  historyEl.innerHTML = "";
  db.collection("users")
    .doc(userId)
    .collection("stats")
    .orderBy("__name__","desc")
    .limit(14)
    .get()
    .then(snap => {
      snap.docs.forEach(doc => {
        const data = doc.data();
        let count = 0;
        baseHabits.forEach(h => {
          if(data[h]) count++;
        });
        const div = document.createElement("div");
        div.textContent = `${doc.id}: ${count}/${baseHabits.length} הושלם`;
        historyEl.appendChild(div);
      });
      log("סטטיסטיקה 14 יום נטענה בהצלחה.");
    })
    .catch(err => log("שגיאה בטעינת סטטיסטיקה 14 יום: " + err.message));
}

// ניווט
function goManage() {
  window.location.href = "manage.html";
}

// התנתקות
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    log("התנתק בהצלחה!");
    window.location.href = "index.html";
  });
});

// הוספת הרגל יומי עם כפתור
addTempBtn.addEventListener("click", addTempHabit);
