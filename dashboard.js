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

// ➕ הוספת הרגל חד פעמי
function addTempHabit() {
  const text = tempHabitInput.value.trim();
  if (!text) return;

  if (dailyStats[today][text] !== undefined) {
    alert("הרגל כזה כבר קיים היום");
    return;
  }

  dailyStats[today][text] = false;
  tempHabitInput.value = "";
  saveStats();
  render();
}

// ✏️ עריכת הרגל חד פעמי
function editTempHabit(oldName) {
  const newName = prompt("ערוך הרגל חד פעמי:", oldName);
  if (newName === null) return;

  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;

  if (dailyStats[today][trimmed] !== undefined) {
    alert("הרגל כזה כבר קיים היום");
    return;
  }

  dailyStats[today][trimmed] = dailyStats[today][oldName];
  delete dailyStats[today][oldName];
  saveStats();
  render();
}

// 🗑 מחיקת הרגל חד פעמי
function deleteTempHabit(name) {
  if (!confirm("למחוק את ההרגל החד פעמי?")) return;
  delete dailyStats[today][name];
  saveStats();
  render();
}

// 🔄 רנדר
function render() {
  habitListEl.innerHTML = "";

  const baseHabits = JSON.parse(localStorage.getItem("allHabits")) || [];
  const baseNames = baseHabits.map(h => h.text);

  let done = 0;
  let total = 0;

  // הרגלים קבועים
  baseNames.forEach(name => {
    if (dailyStats[today][name] === undefined) {
      dailyStats[today][name] = false;
    }

    const li = createHabitRow(name, false);
    habitListEl.appendChild(li);

    if (dailyStats[today][name]) done++;
    total++;
  });

  // הרגלים חד פעמיים
  Object.keys(dailyStats[today]).forEach(name => {
    if (!baseNames.includes(name)) {
      const li = createHabitRow(name, true);
      habitListEl.appendChild(li);

      if (dailyStats[today][name]) done++;
      total++;
    }
  });

  totalHabitsEl.textContent = total;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${total}`;

  saveStats();
  renderHistory();
}

// יצירת שורת הרגל
function createHabitRow(name, isTemp) {
  const li = document.createElement("li");

  const label = document.createElement("span");
  label.textContent = isTemp ? `${name} (חד פעמי)` : name;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = dailyStats[today][name];
  checkbox.onchange = () => {
    dailyStats[today][name] = checkbox.checked;
    saveStats();
    render();
  };

  li.appendChild(label);
  li.appendChild(checkbox);

  if (isTemp) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => editTempHabit(name);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.onclick = () => deleteTempHabit(name);

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
  }

  return li;
}

// 📈 היסטוריה
function renderHistory() {
  historyEl.innerHTML = "";
  const days = 14;
  const keys = Object.keys(dailyStats).sort().slice(-days);

  keys.forEach(day => {
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
