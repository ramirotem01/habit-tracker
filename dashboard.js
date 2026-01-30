const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const tempHabitInput = document.getElementById("tempHabitInput");
const historyEl = document.getElementById("history");
const logoutBtn = document.getElementById("logoutBtn");
const logEl = document.getElementById("log");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let userId = null;
let baseHabits = [];
let tempHabits = [];
let dailyStats = {};

// =======================
// התנתקות
// =======================
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => window.location.href = "index.html");
});

// =======================
// בדיקה אם מחובר
// =======================
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

// =======================
// טעינת נתונים
// =======================
function loadAll() {
  Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()])
    .then(render)
    .catch(err => log("שגיאה בטעינת נתונים: " + err.message));
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
    .then(doc => dailyStats = doc.exists ? doc.data() : {});
}

// =======================
// פעולות על הרגלים
// =======================
function toggleHabit(name, value) {
  dailyStats[name] = value;
  db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .set(dailyStats)
    .then(() => log("סטטוס הרגל עודכן: " + name + " = " + value))
    .catch(err => log("שגיאה בעדכון סטטוס: " + err.message));
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

// =======================
// רינדור
// =======================
function render() {
  habitListEl.innerHTML = "";
  let done = 0;
  const all = [...baseHabits, ...tempHabits.map(h => h.text)];

  all.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => {
      toggleHabit(text, cb.checked);
      render();
    };

    li.append(cb);
    habitListEl.appendChild(li);

    if(cb.checked) done++;
  });

  totalHabitsEl.textContent = all.length;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${all.length}`;

  renderHistory();
}

// =======================
// היסטוריה 14 יום
// =======================
function renderHistory() {
  if(!historyEl) return;
  historyEl.innerHTML = "";
  const days = 14;

  db.collection("users")
    .doc(userId)
    .collection("stats")
    .orderBy("__name__", "desc")
    .limit(days)
    .get()
    .then(snap => {
      snap.docs.reverse().forEach(doc => {
        const data = doc.data();
        let habitsDone = Object.values(data).filter(v => v).length;
        const div = document.createElement("div");
        div.textContent = `${doc.id}: ${habitsDone}/${baseHabits.length} הושלם`;
        historyEl.appendChild(div);
      });
    });
}

// =======================
// ניווט
// =======================
function goManage() {
  window.location.href = "manage.html";
}

function log(msg) {
  console.log(msg);
  if(logEl) logEl.textContent = msg;
}
