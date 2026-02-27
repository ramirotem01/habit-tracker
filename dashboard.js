// פונקציה לעדכון ה-UI של רשימת ההרגלים
function renderHabits(habits) {
    const habitList = document.getElementById('habitList');
    habitList.innerHTML = ''; // ניקוי הרשימה

    habits.forEach(habit => {
        // יצירת אלמנט הליסט
        const li = document.createElement('li');
        li.className = 'habit-item';
        
        // יצירת הצ'קבוקס החדשני
        const checkbox = document.createElement('div');
        checkbox.className = `custom-checkbox ${habit.completed ? 'checked' : ''}`;
        
        // הוספת אירוע לחיצה על הצ'קבוקס
        checkbox.onclick = () => {
            toggleHabitStatus(habit.id, !habit.completed);
        };

        // טקסט המשימה
        const span = document.createElement('span');
        span.className = 'task-text-span';
        span.innerText = habit.name || habit.text;
        if (habit.completed) {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.6';
        }

        // חיבור האלמנטים
        li.appendChild(checkbox);
        li.appendChild(span);
        habitList.appendChild(li);
    });
}

// פונקציית עזר לעדכון הסטטוס (תוודא שהיא קיימת אצלך בשם דומה)
async function toggleHabitStatus(habitId, newStatus) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // עדכון ב-Firestore (לפי המבנה של pcs365.co.il)
        await db.collection("users").doc(user.uid)
                .collection("dailyHabits").doc(habitId)
                .update({ completed: newStatus });
        
        // טעינה מחדש של הנתונים כדי לעדכן את הגרף והעיגולים
        loadDailyData(); 
    } catch (error) {
        console.error("Error updating habit:", error);
    }
}
