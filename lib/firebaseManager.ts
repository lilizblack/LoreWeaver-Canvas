import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { useUserStore } from "../store/useUserStore";

// Master Config from Env
const masterConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const BYOH_APP_NAME = "byoh-app";

export interface FirebaseInstance {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

const firestoreCache = new Map<string, Firestore>();

/**
 * getMasterApp - Returns the singleton Master Firebase App
 */
export function getMasterApp(): FirebaseApp {
  return getApps().find(app => app.name === "[DEFAULT]") || initializeApp(masterConfig);
}

/**
 * getMasterAuth - Returns Auth from the Master App (ALWAYS used for login)
 */
export function getMasterAuth(): Auth {
  return getAuth(getMasterApp());
}

/**
 * getActiveFirebase - Primary routing logic for Data storage.
 * NOTE: Auth is ALWAYS from Master, but 'db' can be Master or BYOH.
 */
export function getActiveFirebase(): FirebaseInstance {
  const { tier, customFirebaseConfig } = useUserStore.getState();
  const isClient = typeof window !== "undefined";
  const masterApp = getMasterApp();
  const masterAuth = getMasterAuth();

  // If BYOH and we have config, use it for DB
  if (tier === "byoh" && customFirebaseConfig) {
    let byohApp: FirebaseApp;
    
    const existingApp = getApps().find(app => app.name === BYOH_APP_NAME);
    if (existingApp) {
      byohApp = existingApp;
    } else {
      try {
        byohApp = initializeApp(customFirebaseConfig, BYOH_APP_NAME);
      } catch (e) {
        byohApp = getApp(BYOH_APP_NAME);
      }
    }

    let db: Firestore;
    if (firestoreCache.has(BYOH_APP_NAME)) {
      db = firestoreCache.get(BYOH_APP_NAME)!;
    } else {
      try {
        // Double check apps list to avoid "already called" errors on hot reloads
        db = getFirestore(byohApp);
      } catch (e) {
        db = isClient 
          ? initializeFirestore(byohApp, {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
              }),
            })
          : getFirestore(byohApp);
      }
      firestoreCache.set(BYOH_APP_NAME, db);
    }

    return {
      app: byohApp,
      db,
      auth: masterAuth // STILL USE MASTER AUTH
    };
  }

  // Fallback to Master for both Auth and DB
  let db: Firestore;
  if (firestoreCache.has("[DEFAULT]")) {
    db = firestoreCache.get("[DEFAULT]")!;
  } else {
    try {
      db = getFirestore(masterApp);
    } catch (e) {
      db = isClient 
        ? initializeFirestore(masterApp, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          })
        : getFirestore(masterApp);
    }
    firestoreCache.set("[DEFAULT]", db);
  }

  return {
    app: masterApp,
    db,
    auth: masterAuth
  };
}
