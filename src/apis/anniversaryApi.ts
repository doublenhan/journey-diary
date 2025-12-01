// src/api/anniversaryApi.ts
import { db, getCollectionName } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

export interface Anniversary {
  id: string;
  userId: string;
  title: string;
  date: string;
  type:
    | 'custom'
    | 'first_date'
    | 'engagement'
    | 'wedding'
    | 'first_meeting'
    | 'proposal'
    | 'honeymoon'
    | 'birthday'
    | 'valentine';
  reminderDays: number;
  isNotificationEnabled: boolean;
}

export const anniversaryApi = {
  async getAll(userId: string): Promise<Anniversary[]> {
    const anniversariesRef = collection(db, getCollectionName('AnniversaryEvent'));
    // Remove orderBy to avoid composite index requirement, sort in FE instead
    const q = query(anniversariesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as Anniversary);
    // Sort by date in frontend
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
  async add(userId: string, data: Omit<Anniversary, 'id' | 'userId'>): Promise<string> {
    const docRef = await addDoc(collection(db, getCollectionName('AnniversaryEvent')), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },
  async update(id: string, data: Partial<Omit<Anniversary, 'id' | 'userId'>>): Promise<void> {
    const docRef = doc(db, getCollectionName('AnniversaryEvent'), id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, getCollectionName('AnniversaryEvent'), id));
  },
};
