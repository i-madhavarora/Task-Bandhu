import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

// Multi-Tab Persistent Offline Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
