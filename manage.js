const habitList = document.getElementById("habitList");
const newHabit = document.getElementById("newHabit");

let habits = [];
let userId = null;

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userId = user.uid;
  loadHabits();
});

function loadHabits() {
  db.collection("users")
    .doc(userId)
    .collection("habits")
    .orderBy("createdAt")
    .get()
    .then(snapshot => {
      habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      render();
    });
}

function addHabit() {
  const text = newHabit.value.trim();
  if (!text) return;

  db.collection("users")
    .doc(userId)
    .collection("habits")
    .add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      newHabit.value = "";
      loadHabits();
    });
}

function deleteHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("habits")
    .doc(id)
    .delete()
    .then(loadHabits);
}

function editHabit(id, currentText) {
  const updated = prompt("עדכן הרגל:", currentText);
  if (!updated) return;

  db.collection("users")
    .doc(userId)
    .collection("habits")
    .doc(id)
    .update({ text: updated })
    .then(loadHabits);
}

function render() {
  habitList.innerHTML = "";

  habits.forEach(habit => {
    const li = document.createElement("li");
    li.textContent = habit.text;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏ עריכה";
    editBtn.onclick = () => editHabit(habit.id, habit.text);

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑 מחיקה";
    delBtn.onclick = () => deleteHabit(habit.id);

    li.appendChild(editBtn);
    li.appendChild(delBtn);
    habitList.appendChild(li);
  });
}

function goDashboard() {
  window.location.href = "index.html";
}
