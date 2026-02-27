/**
 * מעדכן את רשימת ההרגלים ב-DOM עם העיצוב החדשני
 * @param {Array} habits - מערך של אובייקטי הרגלים מה-Firestore
 */
function renderHabits(habits) {
    const habitList = document.getElementById('habitList');
    habitList.innerHTML = ''; // ניקוי הרשימה הקיימת

    if (habits.length === 0) {
        habitList.innerHTML = `<p style="text-align:center; color:#95a5a6; padding:20px; font-style:italic;">אין משימות להציג...</p>`;
        return;
    }

    habits.forEach(habit => {
        // יצירת אלמנט הליסט (הקונטיינר המעוגל)
        const li = document.createElement('li');
        li.className = 'habit-item';
        
        // יצירת הצ'קבוקס המעוצב (הריבוע המודרני)
        const checkbox = document.createElement('div');
        checkbox.className = `custom-checkbox ${habit.completed ? 'checked' : ''}`;
        
        // הוספת אירוע לחיצה על הצ'קבוקס
        checkbox.onclick = (e) => {
            e.stopPropagation(); // מניעת כפילות לחיצה
            toggleHabitStatus(habit.id, !habit.completed);
        };

        // טקסט המשימה
        const span = document.createElement('span');
        span.className = 'task-text-span';
        span.innerText = habit.name || habit.text;
        
        // עיצוב טקסט אם המשימה הושלמה
        if (habit.completed) {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.6';
        }

        // מאפשר לחיצה גם על הטקסט כדי לסמן "בוצע" (נוחות למשתמש)
        li.onclick = () => {
            toggleHabitStatus(habit.id, !habit.completed);
        };

        // חיבור האלמנטים למבנה הסופי
        li.appendChild(checkbox);
        li.appendChild(span);
        habitList.appendChild(li);
    });
}

/**
 * מעדכן את הסטטוס ב-Firebase ומרענן את הדשבורד
 * @param {string} habitId - ה-ID של המסמך ב-Firestore
 * @param {boolean} newStatus - המצב החדש (true/false)
 */
async function toggleHabitStatus(habitId, newStatus) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        // עדכון ב-Firestore לפי המבנה של pcs365.co.il
        await db.collection("users").doc(user.uid)
                .collection("dailyHabits").doc(habitId)
                .update({ 
                    completed: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
                });
        
        // קריאה לפונקציה הטוענת מחדש את הנתונים (מבטיח שעיגול ההתקדמות והגרף יתעדכנו)
        if (typeof loadDailyData === "function") {
            loadDailyData(); 
        } else {
            console.warn("loadDailyData is not defined. Please ensure it exists to refresh UI.");
        }
    } catch (error) {
        console.error("Error updating habit status:", error);
    }
}
