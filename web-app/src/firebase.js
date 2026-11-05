import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBchIEyM-oFQ_OGC7QIrPuVOuB0yQEdm-w",
  authDomain: "task-manager-madhav.firebaseapp.com",
  projectId: "task-manager-madhav",
  storageBucket: "task-manager-madhav.firebasestorage.app",
  messagingSenderId: "773874730844",
  appId: "1:773874730844:web:da1de427a95d77aa04e399"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 100% Free Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') console.log("Multiple tabs open.");
  else if (err.code == 'unimplemented') console.log("Offline persistence unsupported.");
});