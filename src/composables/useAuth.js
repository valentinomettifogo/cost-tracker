import { ref, onMounted } from "vue";
import { auth, googleProvider, db } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const user = ref(null);

export function useAuth() {
  // keep user reactive
  onMounted(() => {
    onAuthStateChanged(auth, (u) => {
      user.value = u;
      // ensure user document exists whenever we have an authenticated user
      if (u) {
        // don't block UI: run async and log errors
        ensureUserDoc(u).catch((err) => {
          console.error("ensureUserDoc error:", err);
        });
      }
    });
  });

  // create user doc if missing
  async function ensureUserDoc(u) {
    if (!u || !u.uid) {
      console.warn("ensureUserDoc: no user provided");
      return;
    }

    const userRef = doc(db, "users", u.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: u.email || null,
        displayName: u.displayName || u.email ||null,
        createdAt: serverTimestamp(),
        allowedApps: [],
        role: "user",
        sharedWith: []
      });
    }
  }

  // wrap auth functions so we create the user doc immediately after signup/login
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    return cred;
  };

  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    return cred;
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(cred.user);
    return cred;
  };

  const logout = () => signOut(auth);

  return { user, login, register, loginWithGoogle, logout };
}