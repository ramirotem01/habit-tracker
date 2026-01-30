// בתוך ה-DOM Content Loaded, תוסיף את הרשימה החדשה:
const baseHabitListEl = document.getElementById("baseHabitList");
const tempHabitListEl = document.getElementById("tempHabitList");

// ... (שאר הקוד של loadAll, loadBaseHabits וכו' נשאר אותו דבר)

function render() {
    // ניקוי שתי הרשימות
    baseHabitListEl.innerHTML = "";
    tempHabitListEl.innerHTML = "";

    // 1. רינדור הרגלים קבועים
    baseHabits.forEach(text => {
        const li = createHabitItem(text);
        baseHabitListEl.appendChild(li);
    });

    // 2. רינדור משימות חד פעמיות
    tempHabits.forEach(habitObj => {
        // כאן habitObj הוא אובייקט עם {text, id}
        const li = createHabitItem(habitObj.text);
        tempHabitListEl.appendChild(li);
    });

    updateSummary();
    renderHistory();
}

// פונקציית עזר ליצירת שורת משימה עם צ'קבוקס
function createHabitItem(text) {
    const li = document.createElement("li");
    li.className = "habit-item";
    
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = dailyStats[text] || false;
    cb.onchange = () => toggleHabit(text, cb.checked);
    
    const span = document.createElement("span");
    span.textContent = text;
    if (cb.checked) span.style.textDecoration = "line-through";

    li.appendChild(cb);
    li.appendChild(span);
    return li;
}

function updateSummary() {
    const totalCount = baseHabits.length + tempHabits.length;
    // סופרים כמה מתוך המשימות שקיימות היום מסומנות כ-true ב-dailyStats
    const allCurrentTasks = [...baseHabits, ...tempHabits.map(h => h.text)];
    const doneCount = allCurrentTasks.filter(t => dailyStats[t] === true).length;
    
    totalHabitsEl.textContent = totalCount;
    doneTodayEl.textContent = doneCount;
    progressTodayEl.textContent = `${doneCount}/${totalCount}`;
}
