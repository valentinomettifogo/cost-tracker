import { ref, onMounted } from "vue";
import { auth, googleProvider } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from "firebase/auth";

const user = ref(null);

export function useAuth() {
  onMounted(() => {
    onAuthStateChanged(auth, (u) => {
      user.value = u;
    });
  });

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  return { user, login, register, loginWithGoogle, logout };
}
