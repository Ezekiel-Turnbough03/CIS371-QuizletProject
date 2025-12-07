import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useFlashcardStore } from './stores/FlashcardStore';
import FlashcardsScreen from './views/FlashcardsScreen.vue';

const store  = useFlashcardStore()

onAuthStateChanged(getAuth(), (user) => {
  store.setUser(user)
})

export const withGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getAuth(), provider);
    store.setUser(result.user);
  } catch (e) {
    console.error("Google Sign in Failed", e);
  }
};

export const signOutUser = async () => {
  await signOut(getAuth());
  store.setUser(null)
}