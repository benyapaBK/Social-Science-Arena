import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyCTX7LiA4rW1q-0Pa8sfJmBpPJnyn5htBs",
  authDomain: "game-puzzle-6767.firebaseapp.com",
  projectId: "game-puzzle-6767",
  storageBucket: "game-puzzle-6767.firebasestorage.app",
  messagingSenderId: "653363329172",
  appId: "1:653363329172:web:1cbda04374eec8b1f0dc81"
};

// Initialize Firebase once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const rtdb = getDatabase(app);

export default app;
