import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard against double-init during Next.js HMR
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// persistentLocalCache uses IndexedDB which only exists in the browser.
const isClient = typeof window !== "undefined";

const db = isNewApp && isClient
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);

const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const emailProvider = new EmailAuthProvider();

export { app, auth, db, storage, googleProvider, emailProvider };
