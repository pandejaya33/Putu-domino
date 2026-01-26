import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDt4C2gQuyCS28359YP0nryXpv_ASqra8U",
  authDomain: "putu-domino-7fa82.firebaseapp.com",
  projectId: "putu-domino-7fa82",
  storageBucket: "putu-domino-7fa82.firebasestorage.app",
  messagingSenderId: "721819699355",
  appId: "1:721819699355:web:feec9dcc605643d3bcde3e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);