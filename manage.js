// אלמנטים
const habitList = document.getElementById("habitList");
const newHabitInput = document.getElementById("newHabit");
const addHabitBtn = document.getElementById("addHabitBtn");
const goDashboardBtn = document.getElementById("goDashboardBtn");
const logoutBtn = document.getElementById("logoutBtn");

// תיבת לוג
const logDiv = document.createElement("div");
logDiv.style.position = "fixed";
logDiv.style.bottom = "0";
logDiv.style.left = "0";
logDiv.style.right = "0";
logDiv.style.maxHeight = "150px";
logDiv.style.overflowY = "auto";
logDiv.style.backgroundColor = "#000";
logDiv.style.color = "#0f0";
logDiv.style.fontSize = "12px";
logDiv.style.padding = "6px";
logDiv.style.zIndex = "9999";
document.body.appendChild(logDiv);

function log(message) {
  const p = document.createElement("p");
  p.textContent = message;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// נתוני משתמש
let userId = null;
let habits = [];

// בדיקה אם המשתמש מחובר
auth.onAuthStateChanged(user => {
  if (!user) {
    log("משתמש לא מחובר – נשלח ל-login");
    window.location.href = "login.html";
    return;
  }
  userId = user.uid;
  log("משתמש מחובר! userId: " + userId);
  loadHabits();
});

// טען הרגלים מה-Firestore
function loadHabits() {
  log("טוען הרגלים מה-Firestore...");
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
      log("טען " + habits.length + " הרגלים");
      renderHabits();
    })
    .catch(err => log("שגיאה בטעינת הרגלים: " + err.message));
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
  log("לחיצה על הוסף הרגל חדש, ערך: '" + text + "'");

  if (!text) {
    log("אין ערך, לא מוסיף");
    return;
  }

  if (!userId) {
    log("userId ריק, לא ניתן להוסיף הרגל");
    return;
  }

  db.collection("users")
    .doc(userId)
    .collection("habits")
    .add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      log("הרגל נוסף בהצלחה!");
      newHabitInput.value = "";
      loadHabits();
    })
    .catch(err => log("שגיאה בהוספת הרגל: " + err.message));
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
    .then(() => log("הרגל עודכן בהצלחה"))
    .then(loadHabits)
    .catch(err => log("שגיאה בעריכת הרגל: " + err.message));
}

// מחיקת הרגל
function deleteHabit(id) {
  db.collection("users")
    .doc(userId)
    .collection("habits")
    .doc(id)
    .delete()
    .then(() => log("הרגל נמחק בהצלחה"))
    .then(loadHabits)
    .catch(err => log("שגיאה במחיקת הרגל: " + err.message));
}

// ניווט לדשבורד
goDashboardBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// התנתקות
logoutBtn.addEventListener("click", () => {
  auth.signOut()
    .then(() => {
      log("התנתקות הצליחה");
      window.location.href = "login.html";
    })
    .catch(err => log("שגיאה בהתנתקות: " + err.message));
});
