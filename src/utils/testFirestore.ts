/**
 * Test script to verify Firestore users collection can be read
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, query } from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCxsEMj_8_aM8yPpZAYXNKdAUuVi8lyZqQ",
  authDomain: "love-journal-2025.firebaseapp.com",
  projectId: "love-journal-2025",
  storageBucket: "love-journal-2025.firebasestorage.app",
  messagingSenderId: "158837378787",
  appId: "1:158837378787:web:a1cf502cab836eeef4ffd6",
  measurementId: "G-QNDGCYQL31"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test function
async function testFirestoreQuery() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('❌ Not logged in');
        reject(new Error('Not logged in'));
        return;
      }

      console.log(`✅ Logged in as: ${user.uid} (${user.email})`);

      try {
        // Try to fetch from dev_users collection
        const usersRef = collection(db, 'dev_users');
        const q = query(usersRef);
        console.log(`📝 Querying collection: dev_users`);
        
        const querySnapshot = await getDocs(q);
        console.log(`✅ Query successful! Found ${querySnapshot.size} documents`);

        querySnapshot.forEach((doc) => {
          console.log(`📄 User: ${doc.id}`, doc.data());
        });

        resolve(querySnapshot.docs);
      } catch (err) {
        console.error(`❌ Error querying Firestore:`, err);
        reject(err);
      }
    });
  });
}

export default testFirestoreQuery;
