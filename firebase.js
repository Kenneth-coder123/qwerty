import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDtnlWAw6QmQGNHskIYsB4P3kd4Ie0l6SQ',
  authDomain: 'eventvote-4d00e.firebaseapp.com',
  projectId: 'eventvote-4d00e',
  storageBucket: 'eventvote-4d00e.firebasestorage.app',
  messagingSenderId: '309249468247',
  appId: '1:309249468247:web:c41ae6d803455530d80012',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: 'select_account' });
