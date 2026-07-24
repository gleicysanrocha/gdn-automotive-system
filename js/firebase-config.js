
// Firebase Configuration - PLEASE UPDATE WITH YOUR KEYS FROM FIREBASE CONSOLE
// https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "AIzaSyCf74C299CZej2-UvDesC8iNV9vr77vJqk",
  authDomain: "viver-bem-bfbe8.firebaseapp.com",
  projectId: "viver-bem-bfbe8",
  storageBucket: "viver-bem-bfbe8.firebasestorage.app",
  messagingSenderId: "667806663588",
  appId: "1:667806663588:web:21bbc673b36ba2082eb731"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
} else {
    console.error('Firebase SDK not loaded. Check your internet connection or index.html scripts.');
}
