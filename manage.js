const habitList = document.getElementById("habitList");
const newHabit = document.getElementById("newHabit");

let habits = JSON.parse(localStorage.getItem("allHabits")) || [];

function save() {
  localStorage.setItem("allHabits", JSON.stringify(habits));
}

function addHabit() {
  const text = newHabit.value.trim();
  if (!text) return;

  habits.push({ text });
  newHabit.value = "";
  save();
  render();
}

function deleteHabit(index) {
  habits.splice(index, 1);
  save();
  render();
}

function render() {
  habitList.innerHTML = "";
  habits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.textContent = habit.text;

    const btn = document.createElement("button");
    btn.textContent = "🗑 מחיקה";
    btn.onclick = () => deleteHabit(index);

    li.appendChild(btn);
    habitList.appendChild(li);
  });
}

function goDashboard() {
  window.location.href = "index.html";
}

render();
