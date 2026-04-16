import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use (default) if firestoreDatabaseId is missing or looks like a placeholder
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "TODO_FIRESTORE_DATABASE_ID" 
  ? firebaseConfig.firestoreDatabaseId 
  : "(default)";

export const db = getFirestore(app, dbId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics is optional and might not work in all environments (like Chromebooks with restrictions)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Connection test
if (typeof window !== "undefined") {
  import("firebase/firestore").then(({ doc, getDocFromCache, getDocFromServer }) => {
    const testConn = async () => {
      try {
        // Try to fetch a non-existent doc just to check connectivity
        await getDocFromServer(doc(db, '_connection_test_', 'ping'));
        console.log("Firestore connection successful");
      } catch (error: any) {
        if (error.message?.includes('offline') || error.code === 'unavailable') {
          console.error("Firestore is unreachable. Please ensure you have created a database in the Firebase Console (Firestore -> Create Database) and that your internet is stable.");
        }
      }
    };
    testConn();
  });
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
