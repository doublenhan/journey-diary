import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

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

export async function saveUserEffects(userId: string, effects: EffectsSettings): Promise<void> {
  try {
    const effectsRef = doc(db, 'userEffects', userId);
    await setDoc(effectsRef, {
      ...effects,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user effects:', error);
    throw error;
  }
}

export async function getUserEffects(userId: string): Promise<EffectsSettings | null> {
  try {
    const effectsRef = doc(db, 'userEffects', userId);
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
