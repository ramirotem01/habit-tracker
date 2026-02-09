document.addEventListener("DOMContentLoaded", () => {
  const habitList = document.getElementById("habitList");
  const newHabitInput = document.getElementById("newHabit");
  const addHabitBtn = document.getElementById("addHabitBtn");
  const goDashboardBtn = document.getElementById("goDashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let userId = null;
  let habits = [];

  // =====================
  // בדיקה אם המשתמש מחובר
  // =====================
  auth.onAuthStateChanged(user => {
    if (!user) {
      console.log("משתמש לא מחובר, מפנה ל-index.html");
      window.location.href = "index.html";
      return;
    }
    console.log("משתמש מחובר:", user.uid);
    userId = user.uid;
    loadHabits();
  });

  // =====================
  // טעינת הרגלים מה-Firestore
  // =====================
  function loadHabits() {
    console.log("טוען הרגלים...");
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
      })
      .catch(err => console.error("שגיאה בטעינת הרגלים:", err));
  }

  // =====================
  // הוספת הרגל חדש
  // =====================
  addHabitBtn.addEventListener("click", () => {
    const text = newHabitInput.value.trim();
    if (!text) {
      console.log("אין טקסט להרגל חדש");
      return;
    }

    console.log("מוסיף הרגל חדש:", text);

    db.collection("users")
      .doc(userId)
      .collection("habits")
      .add({
        text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log("הרגל נוסף בהצלחה!");
        newHabitInput.value = "";
        loadHabits();
      })
      .catch(err => console.error("שגיאה בהוספת הרגל:", err));
  });

  // =====================
  // מחיקת הרגל
  // =====================
  function deleteHabit(id) {
    if (!confirm("האם למחוק את ההרגל?")) return;
    
    console.log("מוחק הרגל:", id);
    db.collection("users")
      .doc(userId)
      .collection("habits")
      .doc(id)
      .delete()
      .then(() => {
        console.log("הרגל נמחק");
        loadHabits();
      })
      .catch(err => console.error("שגיאה במחיקה:", err));
  }

  // =====================
  // עריכת הרגל
  // =====================
  function editHabit(id, currentText) {
    const updated = prompt("עדכן הרגל:", currentText);
    if (!updated || updated === currentText) return;
    console.log("מעודכן הרגל:", updated);

    db.collection("users")
      .doc(userId)
      .collection("habits")
      .doc(id)
      .update({ text: updated })
      .then(() => {
        console.log("הרגל עודכן");
        loadHabits();
      })
      .catch(err => console.error("שגיאה בעדכון:", err));
  }

  // =====================
  // הצגת הרגלים (מעודכן עם פתיחה ואייקונים)
  // =====================
  function renderHabits() {
    habitList.innerHTML = "";
    habits.forEach(habit => {
      const li = document.createElement("li");
      li.className = "habit-item";
      
      // לחיצה על השורה פותחת/סוגרת אותה
      li.onclick = (e) => {
        // מונע פתיחה אם לחצו על אחד הכפתורים
        if (e.target.closest('.icon-btn')) return;
        li.classList.toggle('open');
      };

      li.innerHTML = `
        <div class="habit-header">
          <span class="habit-text">${habit.text}</span>
          <div class="habit-actions">
            <button class="icon-btn edit-btn">✏️</button>
            <button class="icon-btn delete-btn">🗑️</button>
          </div>
        </div>
      `;

      // חיבור פונקציות לכפתורים
      li.querySelector(".edit-btn").onclick = (e) => {
        e.stopPropagation(); // מונע פתיחת השורה
        editHabit(habit.id, habit.text);
      };

      li.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation(); // מונע פתיחת השורה
        deleteHabit(habit.id);
      };

      habitList.appendChild(li);
    });
  }

  // =====================
  // כפתור לדשבורד
  // =====================
  if (goDashboardBtn) {
    goDashboardBtn.addEventListener("click", () => {
      console.log("עובר לדשבורד");
      window.location.href = "dashboard.html";
    });
  }

  // =====================
  // כפתור התנתקות
  // =====================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log("מתנתק...");
      auth.signOut()
        .then(() => {
          console.log("התנתקות בוצעה");
          window.location.href = "index.html";
        })
        .catch(err => console.error("שגיאה בהתנתקות:", err));
    });
  }
});
