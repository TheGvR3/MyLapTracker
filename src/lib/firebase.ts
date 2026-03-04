import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXbglCBgGJTJZWL-5o36n3bY2muCAMbcA",
  authDomain: "laptimetracker-ce143.firebaseapp.com",
  projectId: "laptimetracker-ce143",
  storageBucket: "laptimetracker-ce143.firebasestorage.app",
  messagingSenderId: "156209330099",
  appId: "1:156209330099:web:f2c4dda8967182ce71fdc6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);