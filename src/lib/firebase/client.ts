// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './client-config'; // Import from the new config file

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const clientAuth = getAuth(app);
// Firestore is initialized in a standard way, without forcing long-polling.
const clientDb = getFirestore(app);
const clientStorage = getStorage(app);

export { app, clientAuth, clientDb, clientStorage };
