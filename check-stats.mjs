// Test script to verify Firestore data
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCxsEMj_8_aM8yPpZAYXNKdAUuVi8lyZqQ",
  authDomain: "love-journal-2025.firebaseapp.com",
  projectId: "love-journal-2025",
  storageBucket: "love-journal-2025.firebasestorage.app",
  messagingSenderId: "158837378787",
  appId: "1:158837378787:web:a1cf502cab836eeef4ffd6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkStats() {
  try {
    console.log('Checking system_stats/storage...');
    const statsDoc = await getDoc(doc(db, 'system_stats', 'storage'));
    
    if (statsDoc.exists()) {
      console.log('✅ Data found:', JSON.stringify(statsDoc.data(), null, 2));
    } else {
      console.log('❌ Document does NOT exist!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStats();
