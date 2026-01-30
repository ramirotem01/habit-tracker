const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");
const logoutBtn = document.getElementById("logoutBtn");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let userId = null;
let baseHabits = [];
let dailyStats = {};

auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "index.html";
  userId = user.uid;
  loadHabits();
});

function loadHabits() {
  db.collection("users").doc(userId).collection("habits").get()
    .then(snap => { baseHabits = snap.docs.map(d => d.data().text); render(); });
}

function toggleHabit(name, value) {
  dailyStats[name] = value;
  db.collection("users").doc(userId).collection("stats").doc(today).set(dailyStats);
}

function render() {
  habitListEl.innerHTML = "";
  let done = 0;
  baseHabits.forEach(text => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => { toggleHabit(text, cb.checked); render(); };
    li.append(text, cb);
    habitListEl.appendChild(li);
    if (cb.checked) done++;
  });
  totalHabitsEl.textContent = baseHabits.length;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${baseHabits.length}`;
}

function goManage() { window.location.href = "manage.html"; }

if (logoutBtn) logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => window.location.href = "index.html");
});
