import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use (default) if firestoreDatabaseId is missing or looks like a placeholder
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "TODO_FIRESTORE_DATABASE_ID" 
  ? firebaseConfig.firestoreDatabaseId 
  : "(default)";

// Enabling experimentalForceLongPolling resolves 'code=unavailable' connectivity issues 
// that often occur in restricted network environments (schools, VPNs, etc.)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export let analytics: any = null;

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
