import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjVR74bc5RSv5mTAMNAaNIGH_YqNaLzAY", 
  authDomain: "membrosfit.firebaseapp.com",
  projectId: "membrosfit", 
  storageBucket: "membrosfit.firebasestorage.app",
  messagingSenderId: "312256697645", 
  appId: "1:312256697645:web:587202fbb3fd75e1c2efa4", 
  measurementId: "G-C2179VJZW0" 
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
