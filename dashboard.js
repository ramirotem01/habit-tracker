const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");
const tempHabitInput = document.getElementById("tempHabitInput");
const logEl = document.getElementById("log");
const logoutBtn = document.getElementById("logoutBtn");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let userId = null;
let baseHabits = [];
let tempHabits = [];
let dailyStats = {};

// ==========================
// התנתקות
// ==========================
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
});

// ==========================
// בדיקה אם מחובר
// ==========================
auth.onAuthStateChanged(user => {
  if (!user) {
    log("משתמש לא מחובר, הפניה ל-login");
    window.location.href = "index.html";
    return;
  }
  userId = user.uid;
  log("משתמש מחובר! userId: " + userId);
  loadAll();
});

// ==========================
// פונקציות טעינה
// ==========================
function loadAll() {
  log("טוען הרגלים מה-Firestore...");
  Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()])
    .then(render)
    .catch(err => log("שגיאה בטעינת הרגלים: " + err.message));
}

function loadBaseHabits() {
  return db.collection("users")
    .doc(userId)
    .collection("habits")
    .get()
    .then(snap => {
      baseHabits = snap.docs.map(d => d.data().text);
      log("טעון הרגלים קבועים: " + baseHabits.join(", "));
    });
}

function loadTempHabits() {
  return db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .get()
    .then(snap => {
      tempHabits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      log("טעון הרגלים יומיים: " + tempHabits.map(h => h.text).join(", "));
    });
}

function loadDailyStats() {
  return db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .get()
    .then(doc => {
      dailyStats = doc.exists ? doc.data() : {};
    });
}

// ==========================
// פעולות על הרגלים
// ==========================
function toggleHabit(name, value) {
  dailyStats[name] = value;

  db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .set(dailyStats)
    .then(() => log("סטטוס הרגל עודכן: " + name + " = " + value))
    .catch(err => log("שגיאה בעדכון הרגל: " + err.message));
}

function addTempHabit() {
  const text = tempHabitInput.value.trim();
  if (!text) return;

  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .add({ text })
    .then(() => {
      tempHabitInput.value = "";
      log("הרגל יומי נוסף: " + text);
      loadAll();
    })
    .catch(err => log("שגיאה בהוספת הרגל יומי: " + err.message));
}

function deleteTempHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .doc(id)
    .delete()
    .then(loadAll)
    .catch(err => log("שגיאה במחיקת הרגל יומי: " + err.message));
}

function editTempHabit(id, currentText) {
  const updated = prompt("עדכן הרגל זמני:", currentText);
  if (!updated) return;

  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .doc(id)
    .update({ text: updated })
    .then(loadAll)
    .catch(err => log("שגיאה בעריכת הרגל יומי: " + err.message));
}

// ==========================
// רינדור
// ==========================
function render() {
  habitListEl.innerHTML = "";
  let done = 0;
  const all = [...baseHabits, ...tempHabits.map(h => h.text)];

  all.forEach(text => {
    const li = document.createElement("li");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => {
      toggleHabit(text, cb.checked);
      render();
    };

    li.append(text, cb);
    habitListEl.appendChild(li);

    if (cb.checked) done++;
  });

  // הרגלים זמניים עם כפתורי עריכה/מחיקה
  tempHabits.forEach(h => {
    const li = document.createElement("li");
    li.textContent = "🕒 " + h.text;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏";
    editBtn.onclick = () => editTempHabit(h.id, h.text);

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.onclick = () => deleteTempHabit(h.id);

    li.append(editBtn, delBtn);
    habitListEl.appendChild(li);
  });

  totalHabitsEl.textContent = all.length;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${all.length}`;
}

// ==========================
// ניווט לדף ניהול
// ==========================
function goManage() {
  window.location.href = "manage.html";
}

// ==========================
// לוג
// ==========================
function log(msg) {
  console.log(msg);
  if(logEl) logEl.textContent = msg;
}
