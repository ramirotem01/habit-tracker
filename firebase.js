// firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyAwduvJv0z1T5dyV724zmkO83hj9SJFKf4",
  authDomain: "habittrackermultiuser.firebaseapp.com",
  projectId: "habittrackermultiuser",
  storageBucket: "habittrackermultiuser.appspot.com",
  messagingSenderId: "59091703051",
  appId: "1:59091703051:web:ef768b4823f3c77e58fe0e",
  measurementId: "G-HWNWP0C8DE"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.auth = firebase.auth();
window.db = firebase.firestore();

// --- פונקציות עזר ל-Habit Battles ---

// 1. הצטרפות לליגה והזרקת ההרגל לדשבורד
window.joinLeague = async (leagueId) => {
    const user = auth.currentUser;
    if (!user) return;

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();
    
    if (!leagueDoc.exists) return;
    const leagueData = leagueDoc.data();

    // בדיקה אם המשתמש כבר רשום בליגה
    const members = leagueData.members || [];
    const alreadyMember = members.some(m => m.uid === user.uid);

    if (!alreadyMember) {
        let cleanName = user.displayName;
        if (!cleanName || cleanName === "" || cleanName === "משתמש PCS") {
            cleanName = user.email ? user.email.split('@')[0] : "User";
        }

        const newMember = {
            uid: user.uid,
            name: cleanName,
            email: user.email,
            score: 0,
            streak: 0,
            lastUpdated: firebase.firestore.Timestamp.now() // תיקון לפורמט פיירבייס
        };

        await leagueRef.update({
            members: firebase.firestore.FieldValue.arrayUnion(newMember)
        });
    }

    // הוספת ההרגל של הליגה לרשימת ההרגלים האישית
    const habitRef = db.collection("users").doc(user.uid).collection("habits");
    const habitCheck = await habitRef.where("text", "==", leagueData.habitTask).get();
    
    if (habitCheck.empty) {
        await habitRef.add({
            text: leagueData.habitTask,
            isLeagueHabit: true,
            leagueId: leagueId,
            createdAt: firebase.firestore.Timestamp.now() // תיקון קריטי ל-AI
        });
        console.log("Joined league and habit added!");
    }
};

// 2. עדכון ניקוד בליגה כשמסמנים וי בדשבורד
window.syncHabitWithLeague = async (taskText, isChecked) => {
    const user = auth.currentUser;
    if (!user) return;

    const habitSnap = await db.collection("users").doc(user.uid)
        .collection("habits")
        .where("text", "==", taskText)
        .where("isLeagueHabit", "==", true)
        .get();

    if (habitSnap.empty) return;

    const habitData = habitSnap.docs[0].data();
    const leagueId = habitData.leagueId;

    await updateLeagueScore(leagueId, user.uid, isChecked);
};

// 3. לוגיקת חישוב הניקוד הפנימית של הליגה
async function updateLeagueScore(leagueId, userId, isDone) {
    const leagueRef = db.collection("leagues").doc(leagueId);
    const doc = await leagueRef.get();
    if (!doc.exists) return;

    let members = doc.data().members || [];
    const memberIndex = members.findIndex(m => m.uid === userId);

    if (memberIndex > -1) {
        if (isDone) {
            members[memberIndex].score += 10;
            members[memberIndex].streak += 1;
        } else {
            members[memberIndex].score = Math.max(0, members[memberIndex].score - 10);
            members[memberIndex].streak = Math.max(0, members[memberIndex].streak - 1);
        }
        members[memberIndex].lastUpdated = firebase.firestore.Timestamp.now(); // תיקון
        
        await leagueRef.update({ members: members });
    }
}

console.log("Firebase initialized successfully");
