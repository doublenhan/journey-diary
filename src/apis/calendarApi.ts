import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Determine collection name based on environment
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';
const USERS_COLLECTION = `${ENV_PREFIX}users`;

export type PhotoLayout = 'minimalist' | 'classic' | 'gallery' | 'collage';

export interface CalendarSettings {
  year: number;
  themeId: string;
  photoLayout: PhotoLayout;
  customGradient?: {
    from: string;
    to: string;
  };
  title: string;
  subtitle: string;
  description: string;
  coverPhoto?: string;
  months: Array<{
    month: number;
    year: number;
    name: string;
    photos: string[];
    memoryIds?: string[];
  }>;
}

export const saveCalendarSettings = async (
  userId: string,
  settings: CalendarSettings
): Promise<void> => {
  try {
    const calendarRef = doc(db, USERS_COLLECTION, userId, 'calendar', String(settings.year));
    
    // Remove undefined fields to avoid Firestore errors
    const dataToSave: any = {
      year: settings.year,
      themeId: settings.themeId,
      photoLayout: settings.photoLayout,
      title: settings.title,
      subtitle: settings.subtitle,
      description: settings.description,
      months: settings.months,
      updatedAt: new Date().toISOString()
    };
    
    // Only add customGradient if it's defined
    if (settings.customGradient) {
      dataToSave.customGradient = settings.customGradient;
    }
    
    await setDoc(calendarRef, dataToSave);
  } catch (error) {
    console.error('Error saving calendar settings:', error);
    throw new Error('Failed to save calendar settings');
  }
};

export const loadCalendarSettings = async (
  userId: string,
  year: number
): Promise<CalendarSettings | null> => {
  try {
    console.log('📖 Loading calendar from:', USERS_COLLECTION, userId, 'calendar', String(year));
    const calendarRef = doc(db, USERS_COLLECTION, userId, 'calendar', String(year));
    const calendarDoc = await getDoc(calendarRef);
    
    console.log('📄 Calendar doc exists?', calendarDoc.exists());
    if (calendarDoc.exists()) {
      const data = calendarDoc.data();
      console.log('📦 Raw calendar data from Firestore:', data);
      const settings = {
        year: data.year,
        themeId: data.themeId,
        photoLayout: data.photoLayout || 'minimalist',
        customGradient: data.customGradient,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        months: data.months
      };
      console.log('✅ Parsed calendar settings:', settings);
      return settings;
    }
    
    console.log('⚠️ No saved calendar found for year', year);
    return null;
  } catch (error) {
    console.error('❌ Error loading calendar settings:', error);
    throw new Error('Failed to load calendar settings');
  }
};
