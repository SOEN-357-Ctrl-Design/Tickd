import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiOjXFiTwxy3WnE3OGNVJVdnmkinjrosI",
  authDomain: "tickd-3d318.firebaseapp.com",
  projectId: "tickd-3d318",
  storageBucket: "tickd-3d318.firebasestorage.app",
  messagingSenderId: "305578734886",
  appId: "1:305578734886:web:6559a2791c01db93d67de7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);