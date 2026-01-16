
// Firebase Configuration - PLEASE UPDATE WITH YOUR KEYS FROM FIREBASE CONSOLE
// https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "AIzaSyArEotcuBoizOMT0s3nR1E9-xVMnoWcSRw",
  authDomain: "gdn-automotive.firebaseapp.com",
  projectId: "gdn-automotive",
  storageBucket: "gdn-automotive.firebasestorage.app",
  messagingSenderId: "574291485994",
  appId: "1:574291485994:web:e6ab6567bf22724b5b2a53"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
} else {
    console.error('Firebase SDK not loaded. Check your internet connection or index.html scripts.');
}
