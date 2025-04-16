// Import necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYrDhWHgvYgDmoCgrOKL7xgRVXY3YiWmQ",
  authDomain: "taskmanager-ad759.firebaseapp.com",
  projectId: "taskmanager-ad759",
  storageBucket: "taskmanager-ad759.appspot.com",
  messagingSenderId: "1019986325201",
  appId: "1:1019986325201:web:18527961e3438b77b29ff0",
  measurementId: "G-M4Y30C1FF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
