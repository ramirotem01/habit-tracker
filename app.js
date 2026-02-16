// טעינת הרגלים
let habits = JSON.parse(localStorage.getItem("habits")) || [];

// מערכת תרגום מקומית לסקריפט
const translations = {
    he: {
        dateLocale: "he-IL",
        totalLabel: "סה\"כ הרגלים:",
        progressLabel: "התקדמות היום:",
        defaultHabitName: "הרגל ללא שם"
    },
    en: {
        dateLocale: "en-US",
        totalLabel: "Total Habits:",
        progressLabel: "Today's Progress:",
        defaultHabitName: "Unnamed Habit"
    }
};

const userLang = navigator.language.startsWith('he') ? 'he' : 'en';
const t = translations[userLang];

// עדכון תאריך בפורמט הנכון
const today = new Date().toLocaleDateString(t.dateLocale, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
});
document.getElementById("todayDate").innerText = today;

function render() {
    const list = document.getElementById("habitList");
    list.innerHTML = "";

    let doneToday = 0;

    habits.forEach((habit, index) => {
        const li = document.createElement("li");
        li.className = "habit-item"; // הוספת קלאס לעיצוב קל יותר

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = habit.done;
        checkbox.onchange = () => {
            habit.done = checkbox.checked;
            save();
        };

        if (habit.done) doneToday++;

        // יצירת אלמנט טקסט להרגל
        const span = document.createElement("span");
        span.innerText = habit.name || t.defaultHabitName;

        // הוספה לרשימה - הצ'קבוקס והטקסט יסתדרו לפי ה-dir של ה-body
        li.append(span, checkbox);
        list.appendChild(li);
    });

    // עדכון לייבלים של סטטיסטיקה (במידה ויש אלמנטים כאלו ב-HTML)
    const totalLabelEl = document.getElementById("totalLabel");
    if(totalLabelEl) totalLabelEl.innerText = t.totalLabel;
    
    const progressLabelEl = document.getElementById("progressLabel");
    if(progressLabelEl) progressLabelEl.innerText = t.progressLabel;

    document.getElementById("totalHabits").innerText = habits.length;
    document.getElementById("todayProgress").innerText = `${doneToday}/${habits.length}`;
}

function addHabit() {
    const input = document.getElementById("newHabit");
    if (!input || !input.value.trim()) return;

    habits.push({ name: input.value.trim(), done: false });
    input.value = "";
    save();
}

function save() {
    localStorage.setItem("habits", JSON.stringify(habits));
    render();
}

// גרף 14 ימים (דמו) - נשאר זהה, ה-CSS יטפל בכיווניות שלו
const progressContainer = document.getElementById("progress14");
if (progressContainer) {
    progressContainer.innerHTML = ""; // ניקוי לפני רינדור מחדש
    for (let i = 0; i < 14; i++) {
        const day = document.createElement("div");
        day.className = "day";
        day.style.height = `${20 + Math.random() * 40}px`;
        progressContainer.appendChild(day);
    }
}

// הרצה ראשונית
render();
