import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/firebaseConfig';
import { LanguageCode } from '../config/languages';

export interface UserLanguagePreference {
  language: LanguageCode;
  updatedAt: string;
}

/**
 * Save user's language preference to Firebase
 */
export async function saveUserLanguage(
  userId: string,
  language: LanguageCode
): Promise<void> {
  try {
    const userDoc = doc(db, getCollectionName('users'), userId);
    
    await setDoc(
      userDoc,
      {
        language,
        languageUpdatedAt: new Date().toISOString(),
      },
      { merge: true } // Merge to not overwrite other user data
    );
    
    console.log(`Language preference saved: ${language} for user ${userId}`);
  } catch (error) {
    console.error('Error saving language preference:', error);
    throw error;
  }
}

/**
 * Get user's language preference from Firebase
 */
export async function getUserLanguage(
  userId: string
): Promise<LanguageCode | null> {
  try {
    const userDoc = doc(db, getCollectionName('users'), userId);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const language = data.language as LanguageCode;
      
      if (language === 'vi' || language === 'en') {
        console.log(`Language preference loaded: ${language} for user ${userId}`);
        return language;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting language preference:', error);
    return null;
  }
}
