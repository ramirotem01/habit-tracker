const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function renderHabits() {
  list.innerHTML = "";

  habits.forEach((habit, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = habit.name;

    const button = document.createElement("button");
    button.textContent = habit.done ? "✔ בוצע" : "סמן בוצע";
    button.className = habit.done ? "done" : "";

    button.onclick = () => {
      habit.done = !habit.done;
      saveHabits();
      renderHabits();
    };

    li.appendChild(span);
    li.appendChild(button);
    list.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  habits.push({
    name: input.value,
    done: false
  });

  input.value = "";
  saveHabits();
  renderHabits();
});

renderHabits();
