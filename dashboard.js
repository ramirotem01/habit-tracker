document.addEventListener("DOMContentLoaded", function() {
  const habitListEl = document.getElementById("habitList");
  const totalHabitsEl = document.getElementById("totalHabits");
  const doneTodayEl = document.getElementById("doneToday");
  const progressTodayEl = document.getElementById("progressToday");
  const todayDateEl = document.getElementById("todayDate");
  const historyEl = document.getElementById("history");
  const tempHabitInput = document.getElementById("tempHabitInput");
  const addTempHabitBtn = document.getElementById("addTempHabitBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const logBox = document.getElementById("logBox");

  function log(msg) {
    const p = document.createElement("div");
    p.textContent = msg;
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
  }

  const today = new Date().toLocaleDateString("he-IL");
  todayDateEl.textContent = today;

  let userId = null;
  let baseHabits = [];
  let tempHabits = [];
  let dailyStats = {};

  auth.onAuthStateChanged(user => {
    if (!user) {
      log("משתמש לא מחובר, מפנה ל-login.html");
      window.location.href = "login.html";
      return;
    }
    userId = user.uid;
    log("משתמש מחובר! userId: " + userId);
    loadAll();
  });

  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        log("התנתקת בהצלחה!");
        window.location.href = "login.html";
      })
      .catch(err => log("שגיאה בהתנתקות: " + err.message));
  });

  window.goManage = function() {
    window.location.href = "manage.html";
  };

  function loadAll() {
    log("טוען הרגלים מה-Firestore...");
    Promise.all([loadBaseHabits(), loadTempHabits(), loadDailyStats()])
      .then(render)
      .catch(err => log("שגיאה בטעינת הנתונים: " + err.message));
  }

  function loadBaseHabits() {
    return db.collection("users")
      .doc(userId)
      .collection("habits")
      .get()
      .then(snap => {
        baseHabits = snap.docs.map(d => d.data().text);
        log("טענתי " + baseHabits.length + " הרגלים בסיסיים");
      })
      .catch(err => log("שגיאה בטעינת הרגלים בסיסיים: " + err.message));
  }

  function loadTempHabits() {
    return db.collection("users")
      .doc(userId)
      .collection("daily")
      .doc(today)
      .collection("tempHabits")
      .get()
      .then(snap => {
        tempHabits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        log("טענתי " + tempHabits.length + " הרגלים יומיים");
      })
      .catch(err => log("שגיאה בטעינת הרגלים יומיים: " + err.message));
  }

  function loadDailyStats() {
    return db.collection("users")
      .doc(userId)
      .collection("stats")
      .doc(today)
      .get()
      .then(doc => {
        dailyStats = doc.exists ? doc.data() : {};
        log("סטטוס יומי נטען");
      })
      .catch(err => log("שגיאה בטעינת סטטוס יומי: " + err.message));
  }

  addTempHabitBtn.addEventListener("click", addTempHabit);

  function addTempHabit() {
    const text = tempHabitInput.value.trim();
    if (!text) return;
    db.collection("users")
      .doc(userId)
      .collection("daily")
      .doc(today)
      .collection("tempHabits")
      .add({ text })
      .then(() => {
        tempHabitInput.value = "";
        log("הוסף הרגל יומי: " + text);
        loadAll();
      })
      .catch(err => log("שגיאה בהוספת הרגל יומי: " + err.message));
  }

  function toggleHabit(name, value) {
    dailyStats[name] = value;
    db.collection("users")
      .doc(userId)
      .collection("stats")
      .doc(today)
      .set(dailyStats)
      .then(() => log("סומן הרגל '" + name + "' כ-" + value))
      .catch(err => log("שגיאה בעדכון סטטוס הרגל: " + err.message));
  }

  function render() {
    habitListEl.innerHTML = "";
    let done = 0;
    const all = [...baseHabits, ...tempHabits.map(h => h.text)];

    all.forEach(text => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = dailyStats[text] || false;
      cb.onchange = () => {
        toggleHabit(text, cb.checked);
        loadAll();
      };
      li.append(text, cb);
      habitListEl.appendChild(li);
      if (cb.checked) done++;
    });

    totalHabitsEl.textContent = all.length;
    doneTodayEl.textContent = done;
    progressTodayEl.textContent = `${done}/${all.length}`;

    renderHistory();
  }

  function renderHistory() {
    historyEl.innerHTML = "";
    const days = 14;
    db.collection("users")
      .doc(userId)
      .collection("stats")
      .orderBy("__name__", "desc")
      .limit(days)
      .get()
      .then(snapshot => {
        snapshot.docs.reverse().forEach(doc => {
          const day = doc.id;
          const data = doc.data();
          let doneCount = Object.values(data).filter(v => v === true).length;
          const div = document.createElement("div");
          div.textContent = `${day}: ${doneCount}/${baseHabits.length} הושלם`;
          historyEl.appendChild(div);
        });
        log("טענתי היסטוריה 14 יום");
      })
      .catch(err => log("שגיאה בטעינת ההיסטוריה: " + err.message));
  }

});
