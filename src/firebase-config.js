// Impor fungsi yang Anda butuhkan dari SDK yang Anda butuhkan
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { getStorage } from 'firebase/storage';

// Firebase Configuration (gunakan data dari Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyA31A9d8QMCnOy2n95KDjKGeQRFywIW3gU",
  authDomain: "event-reminder-2e0c8.firebaseapp.com",
  databaseURL: "https://event-reminder-2e0c8-default-rtdb.firebaseio.com",
  projectId: "event-reminder-2e0c8",
  storageBucket: "event-reminder-2e0c8.firebasestorage.app",
  messagingSenderId: "471969725157",
  appId: "1:471969725157:web:0f219ae9deeb4f1f79b20c",
  measurementId: "G-VQEJNPTDEE"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Dapatkan instance Auth dan Firestore dan Database
const auth = getAuth(app);
const db = getFirestore(app);

// Instance untuk Realtime Database
const storage = getStorage(app);
const database = getDatabase(app);
const firestore = getFirestore(app); 

// Dapatkan instance Analitik
const analytics = getAnalytics(app);

// Mengekspor instance yang digunakan di file lain
export { auth, db, database, storage, firestore, analytics, ref, onValue };

export default app;