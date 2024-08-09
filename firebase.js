// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5BXOOEt5h9p09QJ0sz6fZrGGQDjyJwiw",
  authDomain: "ai-chat-4228c.firebaseapp.com",
  projectId: "ai-chat-4228c",
  storageBucket: "ai-chat-4228c.appspot.com",
  messagingSenderId: "385449924934",
  appId: "1:385449924934:web:02cb2cc1e6329a4f23ad47",
  measurementId: "G-K7B6D5NLZH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const provider = new GoogleAuthProvider();
export const auth = getAuth(app);

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};

export const signUpWithEmail = (email, password) => {
  console.log("email", email);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
