const habitInput = document.getElementById("habitInput");
const habitList = document.getElementById("habitList");

const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const historyEl = document.getElementById("history");

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function addHabit() {
  const text = habitInput.value.trim();
  if (!text) return;

  habits.push({ text, done: false });
  habitInput.value = "";
  save();
  render();
}

function toggleHabit(index) {
  habits[index].done = !habits[index].done;
  save();
  render();
}

function render() {
  habitList.innerHTML = "";

  habits.forEach((habit, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.done;
    checkbox.onchange = () => toggleHabit(index);

    const span = document.createElement("span");
    span.textContent = habit.text;

    li.appendChild(span);
    li.appendChild(checkbox);
    habitList.appendChild(li);
  });

  updateDashboard();
  renderHistory();
}

function updateDashboard() {
  const total = habits.length;
  const done = habits.filter(h => h.done).length;

  totalHabitsEl.textContent = total;
  doneTodayEl.textContent = done;
  progressTodayEl.textContent = `${done}/${total}`;
}

function renderHistory() {
  historyEl.innerHTML = "";
  const days = 14;

  for (let i = days; i >= 1; i--) {
    const div = document.createElement("div");
    div.textContent = `יום -${i}: אין נתונים (פיתוח הבא 😉)`;
    historyEl.appendChild(div);
  }
}

render();
