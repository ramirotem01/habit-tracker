function renderHabits() {
    habitList.innerHTML = "";
    habits.forEach(habit => {
      const li = document.createElement("li");
      li.className = "habit-item";
      
      li.onclick = (e) => {
        if (e.target.closest('.icon-btn')) return;
        li.classList.toggle('open');
      };

      li.innerHTML = `
        <div class="habit-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="habit-text" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 10px;">
            ${habit.text}
          </span>
          <div class="habit-actions" style="display: flex; gap: 10px; flex-shrink: 0;">
            <button class="icon-btn edit-btn">✏️</button>
            <button class="icon-btn delete-btn">🗑️</button>
          </div>
        </div>
      `;

      // חיבור פונקציות לכפתורים
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
