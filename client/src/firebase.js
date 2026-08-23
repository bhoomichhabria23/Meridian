// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvhCcO3gJhZIl86NE1SjWPKs8qlOTuqFc",
  authDomain: "meridian-c8e1a.firebaseapp.com",
  projectId: "meridian-c8e1a",
  storageBucket: "meridian-c8e1a.firebasestorage.app",
  messagingSenderId: "724516429810",
  appId: "1:724516429810:web:cb7d14d3715b304e65556b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };

export default app;