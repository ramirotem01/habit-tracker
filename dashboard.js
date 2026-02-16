// הוספת משימה להיום/לתאריך הנצפה
  addTempHabitBtn.onclick = async () => {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").add({ text });
    tempHabitInput.value = ""; 
    loadAllData();
  };

  // הוספת משימה למחר (החלק שהיה חסר)
  if (addTomorrowHabitBtn) {
    addTomorrowHabitBtn.onclick = async () => {
      const text = tempHabitInput.value.trim();
      if (!text) return;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDocId = getDocId(tomorrow);
      
      try {
        await db.collection("users").doc(userId).collection("daily").doc(tomorrowDocId).collection("tempHabits").add({ text });
        
        const alertMsg = isEn ? `Task "${text}" added for tomorrow!` : `המשימה "${text}" נוספה למחר!`;
        alert(alertMsg);
        
        tempHabitInput.value = "";
        // אם המשתמש כבר צופה במחר, נרענן את הנתונים
        if (getDocId(currentViewDate) === tomorrowDocId) loadAllData();
      } catch (err) {
        console.error("Error adding tomorrow task:", err);
      }
    };
  }

  async function deleteTempHabit(id, text) {
    if (!confirm(isEn ? "Delete?" : "למחוק?")) return;
    await db.collection("users").doc(userId).collection("daily").doc(getDocId(currentViewDate)).collection("tempHabits").doc(id).delete();
    loadAllData();
  }

  logoutBtn.onclick = () => auth.signOut().then(() => window.location.href = "index.html");
});
