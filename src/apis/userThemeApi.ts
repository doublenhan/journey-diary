import { db, getCollectionName } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const saveUserTheme = async (userId: string, theme: string) => {
  const userRef = doc(db, getCollectionName('users'), userId);
  await setDoc(userRef, { theme }, { merge: true });
};

export const getUserTheme = async (userId: string): Promise<string | null> => {
  const userRef = doc(db, getCollectionName('users'), userId);
  const snap = await getDoc(userRef);
  if (snap.exists() && snap.data().theme) {
    return snap.data().theme;
  }
  return null;
};
