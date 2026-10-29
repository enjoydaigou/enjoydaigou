import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Designated Super Admin Firebase Authentication UID
export const SUPER_ADMIN_UID = 'X7Cq5CSZTWQkTn9LtUj6U6YPUpi2';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with specified database ID
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Connection test helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_settings', 'config'));
    return true;
  } catch (err) {
    // If document doesn't exist, it still successfully contacted server
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'permission-denied') {
      return true; // Server is reachable
    }
    console.warn('Firestore server connection test:', err);
    return false;
  }
}
