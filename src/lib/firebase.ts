// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3g6LG1FNoNFgET2zMubovKNSHpoFGh74",
  authDomain: "public-chat-f6a10.firebaseapp.com",
  databaseURL: "https://public-chat-f6a10-default-rtdb.firebaseio.com",
  projectId: "public-chat-f6a10",
  storageBucket: "public-chat-f6a10.appspot.com",
  messagingSenderId: "646142541152",
  appId: "1:646142541152:web:2756cad2dcd8fe9e48f205"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };
