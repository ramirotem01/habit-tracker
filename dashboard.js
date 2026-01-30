const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");
const tempHabitInput = document.getElementById("tempHabitInput");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

// 🔹 Load daily stats
let dailyStats = JSON.parse(localStorage.getItem("dailyStats")) || {};
if (!dailyStats[today]) dailyStats[today] = {};

function saveStats() {
  localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
}

// ➕ הוספת הרגל חד פעמי להיום
function addTempHabit() {
  const text = tempHabitInput.value.trim();
  if (!text) return;

  if (dailyStats[today][text] !== undefined) {
    alert("הרגל כזה כבר קיים היום 🙂");
    return;
  }

  dailyStats[today][text] = false;
  tempHabitInput.value = "";
  saveStats();
  render();
}

// 🔄 render Dashboard
function render() {
  habitListEl.innerHTML = "";

  const baseHabits = JSON.parse(localStorage.getItem("allHabits")) || [];
  const baseHabitNames = baseHabits.map(h => h.text);

  let doneCount = 0;
  let totalCount = 0;

  // 1️⃣ הרגלים קבועים
  baseHabitNames.forEach(name => {
    if (dailyStats[today][name] === undefined) {
      dailyStats[today][name] = false;
    }

    const li = createHabitRow(name);
    habitListEl.appendChild(li);

    if (dailyStats[today][name]) doneCount++;
    totalCount++;
  });

  // 2️⃣ הרגלים חד פעמיים (שאינם בבסיס)
  Object.keys(dailyStats[today]).forEach(name => {
    if (!baseHabitNames.includes(name)) {
      const li = createHabitRow(name, true);
      habitListEl.appendChild(li);

      if (dailyStats[today][name]) doneCount++;
      totalCount++;
    }
  });

  totalHabitsEl.textContent = totalCount;
  doneTodayEl.textContent = doneCount;
  progressTodayEl.textContent = `${doneCount}/${totalCount}`;

  saveStats();
  renderHistory();
}

// יצירת שורה להרגל
function createHabitRow(name, isTemp = false) {
  const li = document.createElement("li");
  li.textContent = name + (isTemp ? " (חד פעמי)" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = dailyStats[today][name];

  checkbox.onchange = () => {
    dailyStats[today][name] = checkbox.checked;
    saveStats();
    render();
  };

  li.appendChild(checkbox);
  return li;
}

// 📈 היסטוריה – 14 ימים
function renderHistory() {
  historyEl.innerHTML = "";
  const days = 14;
  const dailyKeys = Object.keys(dailyStats).sort().slice(-days);

  dailyKeys.forEach(day => {
    const values = Object.values(dailyStats[day]);
    const done = values.filter(v => v).length;
    const total = values.length;

    const div = document.createElement("div");
    div.textContent = `${day}: ${done}/${total} הושלם`;
    historyEl.appendChild(div);
  });
}

// ניווט
function goManage() {
  window.location.href = "manage.html";
}

render();
