// firebase.js

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwduvJv0z1T5dyV724zmkO83hj9SJFKf4",
  authDomain: "habittrackermultiuser.firebaseapp.com",
  projectId: "habittrackermultiuser",
  storageBucket: "habittrackermultiuser.appspot.com",
  messagingSenderId: "59091703051",
  appId: "1:59091703051:web:ef768b4823f3c77e58fe0e",
  measurementId: "G-HWNWP0C8DE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
