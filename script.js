// =====================
// אלמנטים עיקריים
// =====================
const habitListEl = document.getElementById("habitList");
const totalHabitsEl = document.getElementById("totalHabits");
const doneTodayEl = document.getElementById("doneToday");
const progressTodayEl = document.getElementById("progressToday");
const todayDateEl = document.getElementById("todayDate");
const historyEl = document.getElementById("history");

// דף ניהול
const manageListEl = document.getElementById("manageList");
const newHabitInput = document.getElementById("newHabit");

// תאריך היום
const today = new Date().toLocaleDateString("he-IL");
if(todayDateEl) todayDateEl.textContent = today;

// =====================
// טעינת נתונים מ-localStorage
// =====================
let allHabits = JSON.parse(localStorage.getItem("allHabits")) || [];
let dailyStats = JSON.parse(localStorage.getItem("dailyStats")) || {};
if(!dailyStats[today]) dailyStats[today] = {};

// =====================
// שמירה ב-localStorage
// =====================
function saveHabits() {
  localStorage.setItem("allHabits", JSON.stringify(allHabits));
}

function saveStats() {
  localStorage.setItem("dailyStats", JSON.stringify(dailyStats));
}

// =====================
// דשבורד
// =====================
function renderDashboard() {
  if(!habitListEl) return; // אם לא קיים דף דשבורד

  habitListEl.innerHTML = "";

  let doneCount = 0;

  allHabits.forEach(habit => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = habit.text;
    li.appendChild(textSpan);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = dailyStats[today][habit.text] || false;

    checkbox.onchange = () => {
      dailyStats[today][habit.text] = checkbox.checked;
      saveStats();
      renderDashboard();
    };

    li.appendChild(checkbox);
    habitListEl.appendChild(li);

    if(checkbox.checked) doneCount++;
  });

  totalHabitsEl.textContent = allHabits.length;
  doneTodayEl.textContent = doneCount;
  progressTodayEl.textContent = `${doneCount}/${allHabits.length}`;

  renderHistory();
}

// =====================
// ניהול רשימת הרגלים
// =====================
function renderManage() {
  if(!manageListEl) return;

  manageListEl.innerHTML = "";

  allHabits.forEach((habit, index) => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = habit.text;
    li.appendChild(textSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "מחק";
    deleteBtn.onclick = () => {
      allHabits.splice(index, 1);
      saveHabits();
      renderManage();
      renderDashboard(); // סנכרון מיידי עם הדשבורד
    };

    li.appendChild(deleteBtn);
    manageListEl.appendChild(li);
  });
}

// =====================
// הוספת הרגל חדש
// =====================
function addHabit() {
  const text = newHabitInput.value.trim();
  if(text) {
    allHabits.push({ text });
    newHabitInput.value = "";
    saveHabits();
    renderManage();
    renderDashboard();
  }
}

// =====================
// סטטיסטיקה 14 יום
// =====================
function renderHistory() {
  if(!historyEl) return;

  historyEl.innerHTML = "";
  const days = 14;

  // בודק את ה-14 הימים האחרונים
  const dailyKeys = Object.keys(dailyStats).sort().slice(-days);

  dailyKeys.forEach(day => {
    let habitsDone = 0;
    const totalHabits = allHabits.length; // סך ההרגלים הקיימים בדף הניהול ברגע זה

    allHabits.forEach(habit => {
      // ספירת ההרגלים שסומנו בדשבורד ביום זה
      if(dailyStats[day] && dailyStats[day][habit.text]) {
        habitsDone++;
      }
    });

    const div = document.createElement("div");
    div.textContent = `${day}: ${habitsDone}/${totalHabits} הושלם`;
    historyEl.appendChild(div);
  });
}

// =====================
// ניווט בין דפים
// =====================
function goManage() {
  window.location.href = "manage.html";
}

// =====================
// אירועים
// =====================
if(newHabitInput) {
  newHabitInput.addEventListener("keypress", function(e){
    if(e.key === "Enter") addHabit();
  });
}

// =====================
// אתחול
// =====================
renderManage();
renderDashboard();
