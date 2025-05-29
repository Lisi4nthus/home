// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCH_q5B6HZNHCHFiT1Tnr47I1tE109Zu3Y",
  authDomain: "mydiaryapp-5d6f7.firebaseapp.com",
  projectId: "mydiaryapp-5d6f7",
  storageBucket: "mydiaryapp-5d6f7.firebasestorage.app",
  messagingSenderId: "94221040520",
  appId: "1:94221040520:web:eca04517d5aeca8de9983d",
  measurementId: "G-BGBJDKK8J1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
