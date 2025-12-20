import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/firebaseConfig';

export interface EffectsSettings {
  particles: boolean;
  hearts: boolean;
  transitions: boolean;
  glow: boolean;
  fadeIn: boolean;
  slideIn: boolean;
  animationSpeed: number;
}

const DEFAULT_EFFECTS: EffectsSettings = {
  particles: false,
  hearts: false,
  transitions: false,
  glow: false,
  fadeIn: false,
  slideIn: false,
  animationSpeed: 0.5
};

// Save to Firestore only
export async function saveUserEffects(userId: string, effects: EffectsSettings): Promise<void> {
  try {
    const effectsData = {
      ...effects,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore only
    const effectsRef = doc(db, getCollectionName('userEffects'), userId);
    await setDoc(effectsRef, effectsData);
  } catch (error) {
    console.error('Error saving user effects:', error);
    throw error;
  }
}

// Load from Firestore only
export async function getUserEffects(userId: string): Promise<EffectsSettings | null> {
  try {
    // Load from Firestore
    const effectsRef = doc(db, getCollectionName('userEffects'), userId);
    const effectsSnap = await getDoc(effectsRef);
    
    if (effectsSnap.exists()) {
      const data = effectsSnap.data();
      return {
        particles: data.particles ?? DEFAULT_EFFECTS.particles,
        hearts: data.hearts ?? DEFAULT_EFFECTS.hearts,
        transitions: data.transitions ?? DEFAULT_EFFECTS.transitions,
        glow: data.glow ?? DEFAULT_EFFECTS.glow,
        fadeIn: data.fadeIn ?? DEFAULT_EFFECTS.fadeIn,
        slideIn: data.slideIn ?? DEFAULT_EFFECTS.slideIn,
        animationSpeed: data.animationSpeed ?? DEFAULT_EFFECTS.animationSpeed
      };
    }
    
    return DEFAULT_EFFECTS;
  } catch (error) {
    console.error('Error fetching user effects:', error);
    return DEFAULT_EFFECTS;
  }
}
