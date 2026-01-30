// dashboard.js
const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let userId = null;
let baseHabits = [];
let tempHabits = [];
let dailyStats = {};

// בדיקת התחברות
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  userId = user.uid;
  loadAll();
});

// טען הכל
function loadAll() {
  Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()]).then(render);
}

function loadBaseHabits() {
  return db.collection("users").doc(userId).collection("habits").get()
    .then(snap => {
      baseHabits = snap.docs.map(d => d.data().text);
    });
}

function loadTempHabits() {
  return db.collection("users").doc(userId)
    .collection("daily").doc(today).collection("tempHabits").get()
    .then(snap => {
      tempHabits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    });
}

function loadDailyStats() {
  return db.collection("users").doc(userId)
    .collection("stats").doc(today).get()
    .then(doc => { dailyStats = doc.exists ? doc.data() : {}; });
}

// שינוי סטטוס הרגל
function toggleHabit(name, value) {
  dailyStats[name] = value;
  db.collection("users").doc(userId).collection("stats").doc(today).set(dailyStats);
}

// הוספת הרגל זמני
function addTempHabit() {
  const input = document.getElementById("tempHabitInput");
  const text = input.value.trim();
  if (!text) return;

  db.collection("users").doc(userId)
    .collection("daily").doc(today).collection("tempHabits")
    .add({ text })
    .then(() => { input.value = ""; loadAll(); });
}

// מחיקה/עריכה הרגל זמני
function deleteTempHabit(id) {
  db.collection("users").doc(userId)
    .collection("daily").doc(today).collection("tempHabits").doc(id)
    .delete().then(loadAll);
}

function editTempHabit(id, currentText) {
  const updated = prompt("עדכן משימה:", currentText);
  if (!updated) return;
  db.collection("users").doc(userId)
    .collection("daily").doc(today).collection("tempHabits").doc(id)
    .update({ text: updated }).then(loadAll);
}

// רינדור הדשבורד
function render() {
  habitListEl.innerHTML = "";
  let done = 0;
  const all = [...baseHabits, ...tempHabits.map(h => h.text)];

  all.forEach(text => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => { toggleHabit(text, cb.checked); loadAll(); };
    li.append(text, cb);
    habitListEl.appendChild(li);
    if (cb.checked) done++;
  });

  // הרגלים זמניים עם כפתורים
  tempHabits.forEach(h => {
    const li = document.createElement("li");
    li.textContent = "🕒 " + h.text;
    const edit = document.createElement("button");
    edit.textContent = "✏";
    edit.onclick = () => editTempHabit(h.id, h.text);
    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = () => deleteTempHabit(h.id);
    li.append(edit, del);
    habitListEl.appendChild(li);
  });

  totalHabitsEl.textContent = all.length;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${all.length}`;

  renderHistory();
}

function renderHistory() {
  historyEl.innerHTML = "";
  const dailyKeys = Object.keys(dailyStats).sort().slice(-14);
  dailyKeys.forEach(day => {
    let habitsDone = 0;
    const all = [...baseHabits, ...tempHabits.map(h => h.text)];
    all.forEach(h => { if (dailyStats[day] && dailyStats[day][h]) habitsDone++; });
    const div = document.createElement("div");
    div.textContent = `${day}: ${habitsDone}/${all.length} הושלם`;
    historyEl.appendChild(div);
  });
}

function goManage() {
  window.location.href = "manage.html";
}
