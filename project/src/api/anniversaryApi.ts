// src/api/anniversaryApi.ts
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export interface Anniversary {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: 'first_date' | 'engagement' | 'wedding' | 'custom';
  reminderDays: number;
  isNotificationEnabled: boolean;
}

export const anniversaryApi = {
  async getAll(userId: string): Promise<Anniversary[]> {
    const anniversariesRef = collection(db, 'anniversaries');
    const q = query(anniversariesRef, where('userId', '==', userId), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as Anniversary);
  },
  async add(userId: string, data: Omit<Anniversary, 'id' | 'userId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'anniversaries'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },
  async update(id: string, data: Partial<Omit<Anniversary, 'id' | 'userId'>>): Promise<void> {
    const docRef = doc(db, 'anniversaries', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'anniversaries', id));
  },
};
