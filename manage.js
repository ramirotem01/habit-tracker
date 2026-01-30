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

function editHabit(index) {
  const currentText = habits[index].text;
  const updatedText = prompt("ערוך את ההרגל:", currentText);

  if (updatedText === null) return; // ביטול
  if (!updatedText.trim()) return;

  habits[index].text = updatedText.trim();
  save();
  render();
}

function render() {
  habitList.innerHTML = "";

  habits.forEach((habit, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = habit.text;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ עריכה";
    editBtn.onclick = () => editHabit(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑 מחיקה";
    deleteBtn.onclick = () => deleteHabit(index);

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    habitList.appendChild(li);
  });
}

function goDashboard() {
  window.location.href = "index.html";
}

render();
