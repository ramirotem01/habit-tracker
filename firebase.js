// הנתונים שלך מ-Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// אתחול
firebase.initializeApp(firebaseConfig);

// קיצורי דרך
const auth = firebase.auth();
const db = firebase.firestore();
