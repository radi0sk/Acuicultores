import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!getApps().length) {
  try {
    if (process.env.NODE_ENV === 'production' && !serviceAccountKey) {
      // In production (like Vercel or Firebase Hosting), initialize without explicit credentials
      // The SDK will automatically discover credentials from the environment.
      adminApp = initializeApp();
    } else {
      // For local development, use the service account key from environment variables
      if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set for local development.');
      }
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (e: any) {
    console.error('Firebase Admin SDK initialization error:', e.message);
  }
} else {
  adminApp = getApp();
}

// @ts-ignore
if (adminApp) {
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
}

export { adminApp, adminAuth, adminDb, adminStorage };
