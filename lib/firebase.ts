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

// Prevent initialization during build if env vars are missing
const app = !getApps().length && firebaseConfig.apiKey
  ? initializeApp(firebaseConfig)
  : getApps().length > 0 ? getApps()[0] : null;

// Only initialize services if app exists
const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;
const googleProvider = new GoogleAuthProvider();
const emailProvider = new EmailAuthProvider();

// persistentLocalCache uses IndexedDB which only exists in the browser.
const isClient = typeof window !== "undefined";

let db: any = null;
if (app) {
  const isNewApp = getApps().length === 1; // It was just initialized
  db = isNewApp && isClient
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    : getFirestore(app);
}

export { app, auth, db, storage, googleProvider, emailProvider };
