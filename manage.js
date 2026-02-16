document.addEventListener("DOMContentLoaded", () => {
  const habitList = document.getElementById("habitList");
  const newHabitInput = document.getElementById("newHabit");
  const addHabitBtn = document.getElementById("addHabitBtn");
  const goDashboardBtn = document.getElementById("goDashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // מילון תרגומים להודעות קופצות
  const translations = {
    he: {
      confirmDelete: "האם למחוק את ההרגל?",
      editPrompt: "עדכן הרגל:",
      errorLoad: "שגיאה בטעינת הרגלים",
      errorAdd: "שגיאה בהוספת הרגל",
      errorUpdate: "שגיאה בעדכון"
    },
    en: {
      confirmDelete: "Are you sure you want to delete this habit?",
      editPrompt: "Update habit:",
      errorLoad: "Error loading habits",
      errorAdd: "Error adding habit",
      errorUpdate: "Error updating"
    }
  };

  const userLang = navigator.language.startsWith('he') ? 'he' : 'en';
  const t = translations[userLang];

  let userId = null;
  let habits = [];

  // =====================
  // בדיקה אם המשתמש מחובר
  // =====================
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    userId = user.uid;
    loadHabits();
  });

  // =====================
  // טעינת הרגלים מה-Firestore
  // =====================
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
      })
      .catch(err => console.error(t.errorLoad, err));
  }

  // =====================
  // הוספת הרגל חדש
  // =====================
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
      })
      .catch(err => console.error(t.errorAdd, err));
  });

  // =====================
  // מחיקת הרגל
  // =====================
  function deleteHabit(id) {
    if (!confirm(t.confirmDelete)) return;
    
    db.collection("users")
      .doc(userId)
      .collection("habits")
      .doc(id)
      .delete()
      .then(() => {
        loadHabits();
      })
      .catch(err => console.error("Error delete:", err));
  }

  // =====================
  // עריכת הרגל
  // =====================
  function editHabit(id, currentText) {
    const updated = prompt(t.editPrompt, currentText);
    if (!updated || updated === currentText) return;

    db.collection("users")
      .doc(userId)
      .collection("habits")
      .doc(id)
      .update({ text: updated })
      .then(() => {
        loadHabits();
      })
      .catch(err => console.error(t.errorUpdate, err));
  }

  // =====================
  // הצגת הרגלים
  // =====================
  function renderHabits() {
    habitList.innerHTML = "";
    habits.forEach(habit => {
      const li = document.createElement("li");
      li.className = "habit-item";
      
      li.onclick = (e) => {
        if (e.target.closest('.icon-btn')) return;
        
        const isOpen = li.classList.toggle('open');
        const textSpan = li.querySelector('.habit-text');
        
        if (isOpen) {
          textSpan.style.whiteSpace = "normal";
          textSpan.style.overflow = "visible";
        } else {
          textSpan.style.whiteSpace = "nowrap";
          textSpan.style.overflow = "hidden";
        }
      };

      // שימוש ב-margin-inline-start כדי להתאים לכיוון השפה
      li.innerHTML = `
        <div class="habit-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%; min-height: 45px;">
          <span class="habit-text" style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-inline-start: 10px;">
            ${habit.text}
          </span>
          <div class="habit-actions" style="display: flex; gap: 12px; flex-shrink: 0; margin-inline-start: 5px;">
            <button class="icon-btn edit-btn">✏️</button>
            <button class="icon-btn delete-btn">🗑️</button>
          </div>
        </div>
      `;

      li.querySelector(".edit-btn").onclick = (e) => {
        e.stopPropagation();
        editHabit(habit.id, habit.text);
      };

      li.querySelector(".delete-btn").onclick = (e) => {
        e.stopPropagation();
        deleteHabit(habit.id);
      };

      habitList.appendChild(li);
    });
  }

  // =====================
  // ניווט והתנתקות
  // =====================
  if (goDashboardBtn) {
    goDashboardBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut()
        .then(() => {
          window.location.href = "index.html";
        })
        .catch(err => console.error("Logout error:", err));
    });
  }
});
