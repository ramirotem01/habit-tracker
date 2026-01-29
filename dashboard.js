const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

// 🔹 Load today's progress from localStorage
let dailyStats = JSON.parse(localStorage.getItem("dailyStats")) || {};
if(!dailyStats[today]) dailyStats[today] = {};  // עבור כל הרגל נשמר true/false

function saveStats() {
  localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
}

// render Dashboard
function render() {
  habitListEl.innerHTML = "";

  // קח תמיד את הרשימה המדויקת מהניהול
  const allHabits = JSON.parse(localStorage.getItem("allHabits")) || [];
  let doneCount = 0;

  allHabits.forEach(habit => {
    const li = document.createElement("li");
    li.textContent = habit.text;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = dailyStats[today][habit.text] || false;

    checkbox.onchange = () => {
      dailyStats[today][habit.text] = checkbox.checked;
      saveStats();
      render();  // רנדר מחדש אחרי שינוי
    };

    li.appendChild(checkbox);
    habitListEl.appendChild(li);

    if(checkbox.checked) doneCount++;
  });

  totalHabitsEl.textContent = allHabits.length;
  doneTodayEl.textContent = doneCount;
  progressTodayEl.textContent = `${doneCount}/${allHabits.length}`;

  renderHistory();
}

// גרסת דמו להיסטוריה 14 יום
function renderHistory() {
  historyEl.innerHTML = "";
  const days = 14;
  const dailyKeys = Object.keys(dailyStats).sort().slice(-days); // 14 ימים אחרונים

  dailyKeys.forEach(day => {
    const habitsDone = Object.values(dailyStats[day]).filter(v => v).length;
    const total = Object.keys(dailyStats[day]).length;
    const div = document.createElement("div");
    div.textContent = `${day}: ${habitsDone}/${total} הושלם`;
    historyEl.appendChild(div);
  });
}

// ניווט לניהול
function goManage() {
  window.location.href = "manage.html";
}

render();
