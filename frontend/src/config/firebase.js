import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const hasCoreConfig = Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.authDomain) && Boolean(firebaseConfig.projectId);

export const firebaseReady = hasCoreConfig;
export const realtimeReady = hasCoreConfig && Boolean(firebaseConfig.databaseURL);

let app;
let db;
let realtimeDb;

if (firebaseReady) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);

    if (realtimeReady) {
        realtimeDb = getDatabase(app, firebaseConfig.databaseURL);
    }
}

export { app, db, realtimeDb };
