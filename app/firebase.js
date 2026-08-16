import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBNnMnm23gzZdHyj-KVa_G8gEIi_eC0dpk',
  authDomain: 'unodostres-94c3d.firebaseapp.com',
  projectId: 'unodostres-94c3d',
  storageBucket: 'unodostres-94c3d.firebasestorage.app',
  messagingSenderId: '669392127402',
  appId: '1:669392127402:web:4bfdb5ba4e8449cd6f97d3'
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
