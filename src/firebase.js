import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from firebase.txt
const firebaseConfig = {
  apiKey: "AIzaSyAOMxxUn0MpKHCEu7Aa5DBQ4FDmdhil7ek",
  authDomain: "news-app-58b71.firebaseapp.com",
  projectId: "news-app-58b71",
  storageBucket: "news-app-58b71.firebasestorage.app",
  messagingSenderId: "382747067726",
  appId: "1:382747067726:web:c8f4b27bfff1feec760a1f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
