const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");

const today = new Date().toLocaleDateString("he-IL");
todayDateEl.textContent = today;

let todayHabits = JSON.parse(localStorage.getItem("todayHabits")) || [];

// פונקציה לסנכרון עם רשימת ההרגלים העדכנית
function syncHabits() {
  const allHabits = JSON.parse(localStorage.getItem("allHabits")) || [];

  // מפת מיקום ההרגלים הקיימים
  const todayMap = {};
  todayHabits.forEach(h => { todayMap[h.text] = h.done; });

  // בונים todayHabits חדש לפי כל ההרגלים הקיימים ב-allHabits
  todayHabits = allHabits.map(h => {
    return { text: h.text, done: todayMap[h.text] || false };
  });

  saveToday();
}

function saveToday() {
  localStorage.setItem("todayHabits", JSON.stringify(todayHabits));
}

// render Dashboard
function render() {
  syncHabits(); // סנכרון תמידי לפני הצגה
  habitListEl.innerHTML = "";

  let doneCount = 0;
  todayHabits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.textContent = habit.text;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.done;
    checkbox.onchange = () => {
      habit.done = checkbox.checked;
      saveToday();
      render();
    };

    li.appendChild(checkbox);
    habitListEl.appendChild(li);

    if(habit.done) doneCount++;
  });

  totalHabitsEl.textContent = todayHabits.length;
  doneTodayEl.textContent = doneCount;
  progressTodayEl.textContent = `${doneCount}/${todayHabits.length}`;

  renderHistory();
}

// גרסת דמו להיסטוריה 14 יום
function renderHistory() {
  historyEl.innerHTML = "";
  const days = 14;
  for (let i = days; i >= 1; i--) {
    const div = document.createElement("div");
    div.textContent = `יום -${i}: אין נתונים עדיין`;
    historyEl.appendChild(div);
  }
}

// ניווט לניהול
function goManage() {
  window.location.href = "manage.html";
}

render();
