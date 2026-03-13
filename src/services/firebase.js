// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkddXFndJbVUOWs4V2lik_G64f3CL_VKY",
  authDomain: "zatpatt-2f5ed.firebaseapp.com",
  projectId: "zatpatt-2f5ed",
  storageBucket: "zatpatt-2f5ed.firebasestorage.app",
  messagingSenderId: "240565923161",
  appId: "1:240565923161:web:bfeabd001ef620970eb048",
  measurementId: "G-F0Y6RCETYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
