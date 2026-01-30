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

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userId = user.uid;
  loadAll();
});

function loadAll() {
  Promise.all([
    loadBaseHabits(),
    loadTempHabits(),
    loadDailyStats()
  ]).then(render);
}

function loadBaseHabits() {
  return db.collection("users")
    .doc(userId)
    .collection("habits")
    .get()
    .then(snap => {
      baseHabits = snap.docs.map(d => d.data().text);
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
      tempHabits = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
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

function toggleHabit(name, value) {
  dailyStats[name] = value;

  db.collection("users")
    .doc(userId)
    .collection("stats")
    .doc(today)
    .set(dailyStats);
}

function addTempHabit() {
  const input = document.getElementById("tempHabitInput");
  const text = input.value.trim();
  if (!text) return;

  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .add({ text })
    .then(() => {
      input.value = "";
      loadAll();
    });
}

function deleteTempHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .doc(id)
    .delete()
    .then(loadAll);
}

function editTempHabit(id, currentText) {
  const updated = prompt("עדכן משימה:", currentText);
  if (!updated) return;

  db.collection("users")
    .doc(userId)
    .collection("daily")
    .doc(today)
    .collection("tempHabits")
    .doc(id)
    .update({ text: updated })
    .then(loadAll);
}

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
      loadAll();
    };

    li.append(text, cb);
    habitListEl.appendChild(li);

    if (cb.checked) done++;
  });

  // כפתורים להרגלים חד פעמיים
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
}

function goManage() {
  window.location.href = "manage.html";
}
