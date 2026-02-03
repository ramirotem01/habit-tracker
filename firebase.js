// firebase.js

// הגדרות הפרויקט שלך מה-Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAwduvJv0z1T5dyV724zmkO83hj9SJFKf4",
  authDomain: "habittrackermultiuser.firebaseapp.com",
  projectId: "habittrackermultiuser",
  storageBucket: "habittrackermultiuser.appspot.com",
  messagingSenderId: "59091703051",
  appId: "1:59091703051:web:ef768b4823f3c77e58fe0e",
  measurementId: "G-HWNWP0C8DE"
};

// אתחול Firebase - מוודא שהספרייה קיימת לפני האתחול
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// הגדרת השירותים כמשתנים גלובליים (window) כדי שיהיו זמינים בקבצים אחרים (כמו login.js)
window.auth = firebase.auth();
window.db = firebase.firestore();

console.log("Firebase initialized successfully");
