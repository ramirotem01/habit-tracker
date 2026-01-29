let habits = JSON.parse(localStorage.getItem("habits")) || [];

const today = new Date().toLocaleDateString("he-IL");
document.getElementById("todayDate").innerText = today;

function render() {
  const list = document.getElementById("habitList");
  list.innerHTML = "";

  let doneToday = 0;

  habits.forEach((habit, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.done;
    checkbox.onchange = () => {
      habit.done = checkbox.checked;
      save();
    };

    if (habit.done) doneToday++;

    li.append(habit.name, checkbox);
    list.appendChild(li);
  });

  document.getElementById("totalHabits").innerText = habits.length;
  document.getElementById("todayProgress").innerText =
    `${doneToday}/${habits.length}`;
}

function addHabit() {
  const input = document.getElementById("newHabit");
  if (!input.value) return;

  habits.push({ name: input.value, done: false });
  input.value = "";
  save();
}

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
  render();
}

// גרף 14 ימים (דמו)
const progress = document.getElementById("progress14");
for (let i = 0; i < 14; i++) {
  const day = document.createElement("div");
  day.className = "day";
  day.style.height = `${20 + Math.random() * 40}px`;
  progress.appendChild(day);
}

render();
