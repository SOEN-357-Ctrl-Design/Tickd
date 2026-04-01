/**
 * Migration script: copies existing data from the shared "default" document
 * into a new Firebase Auth account (test@test.com / 123456).
 *
 * NOTE: Firebase Auth requires password ≥ 6 characters, so "123" was extended to "123456".
 *
 * Run once:  cd Tickd && node scripts/migrate-test-account.mjs
 *
 * Before running, make sure you have done:  npm install firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDiOjXFiTwxy3WnE3OGNVJVdnmkinjrosI",
  authDomain: "tickd-3d318.firebaseapp.com",
  projectId: "tickd-3d318",
  storageBucket: "tickd-3d318.firebasestorage.app",
  messagingSenderId: "305578734886",
  appId: "1:305578734886:web:6559a2791c01db93d67de7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = '123456';

async function main() {
  // 1. Create or sign in as test user
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✓ Created test user:', userCredential.user.uid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('  Test user already exists, signing in...');
      userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('✓ Signed in as test user:', userCredential.user.uid);
    } else {
      throw e;
    }
  }

  const uid = userCredential.user.uid;

  // 2. Copy userProgress/default → userProgress/{uid}
  const defaultProgressSnap = await getDoc(doc(db, 'userProgress', 'default'));
  if (defaultProgressSnap.exists()) {
    const progressData = defaultProgressSnap.data();
    await setDoc(doc(db, 'userProgress', uid), progressData, { merge: true });
    console.log('✓ Migrated userProgress/default →', `userProgress/${uid}`);
    console.log('  Data:', JSON.stringify(progressData, null, 2));
  } else {
    console.log('⚠ No userProgress/default document found — skipping progress migration.');
  }

  // 3. Copy checklists collection → users/{uid}/checklists
  const checklistsSnap = await getDocs(collection(db, 'checklists'));
  let count = 0;
  for (const docSnap of checklistsSnap.docs) {
    const data = docSnap.data();
    await addDoc(collection(db, 'users', uid, 'checklists'), data);
    count++;
  }
  console.log(`✓ Migrated ${count} checklist(s) → users/${uid}/checklists`);

  console.log('\nDone! You can now log in with:');
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
