// אלמנטים
const habitList = document.getElementById("habitList");
const newHabitInput = document.getElementById("newHabit");
const addHabitBtn = document.getElementById("addHabitBtn");
const goDashboardBtn = document.getElementById("goDashboardBtn");
const logoutBtn = document.getElementById("logoutBtn");

let userId = null;
let habits = [];

// בדיקה אם המשתמש מחובר
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userId = user.uid;
  loadHabits();
});

// טען הרגלים מה-Firestore
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
      renderHabits();
    });
}

// הצגת ההרגלים ברשימה
function renderHabits() {
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

// הוספת הרגל חדש
addHabitBtn.addEventListener("click", () => {
  const text = newHabitInput.value.trim();
  if (!text) return;

  db.collection("users")
    .doc(userId)
    .collection("habits")
    .add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      newHabitInput.value = "";
      loadHabits();
    });
});

// עריכת הרגל
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

// מחיקת הרגל
function deleteHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("habits")
    .doc(id)
    .delete()
    .then(loadHabits);
}

// ניווט לדשבורד
goDashboardBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// התנתקות
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});
