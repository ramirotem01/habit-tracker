// manage.js
const habitList = document.getElementById("habitList");
const newHabit = document.getElementById("newHabit");

let habits = [];
let userId = null;

// בדיקת התחברות
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  userId = user.uid;
  loadHabits();
});

// טעינת הרגלים
function loadHabits() {
  db.collection("users").doc(userId).collection("habits")
    .orderBy("createdAt").get()
    .then(snapshot => {
      habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    });
}

// הוספת הרגל
function addHabit() {
  const text = newHabit.value.trim();
  if (!text) return;

  db.collection("users").doc(userId).collection("habits")
    .add({ text, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
    .then(() => { newHabit.value = ""; loadHabits(); });
}

// מחיקה / עריכה
function deleteHabit(id) {
  db.collection("users").doc(userId).collection("habits").doc(id)
    .delete().then(loadHabits);
}

function editHabit(id, currentText) {
  const updated = prompt("עדכן הרגל:", currentText);
  if (!updated) return;
  db.collection("users").doc(userId).collection("habits").doc(id)
    .update({ text: updated }).then(loadHabits);
}

// רינדור
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

// ניווט לדשבורד
function goDashboard() {
  window.location.href = "dashboard.html";
}
