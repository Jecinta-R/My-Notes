// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQSBOb_VmdzNjqWkfGa0nbINyBQO19_UM",
  authDomain: "mynotes-686e7.firebaseapp.com",
  projectId: "mynotes-686e7",
  storageBucket: "mynotes-686e7.appspot.com", // still included in config, but not used in code
  messagingSenderId: "743029178002",
  appId: "1:743029178002:web:74a114be421e0df3e8f04b",
  measurementId: "G-Z5LSVGC29E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
