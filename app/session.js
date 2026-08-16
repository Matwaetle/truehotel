import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { auth, db } from './firebase.js';

const listeners = new Set();
let state = Object.freeze({ status: 'loading', user: null, profile: null, error: null });

function todayInSeoul() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function nicknameFor(user) {
  return user.displayName?.trim() || user.email?.split('@')[0] || 'HotelHansung guest';
}

function publish(nextState) {
  state = Object.freeze(nextState);
  listeners.forEach((listener) => listener(state));
}

export async function ensureUserDocument(user) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }

  const profile = {
    uid: user.uid,
    nickname: nicknameFor(user),
    verified: false,
    trustedCount: 0,
    dailyCount: 0,
    dailyDate: todayInSeoul()
  };

  await setDoc(userRef, profile);
  return { id: user.uid, ...profile };
}

export function subscribeSession(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getSession() {
  return state;
}

export function requireSession() {
  if (state.status !== 'authenticated' || !state.user || !state.profile) {
    throw new Error('Sign in is required.');
  }
  return state;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    publish({ status: 'anonymous', user: null, profile: null, error: null });
    return;
  }

  publish({ status: 'syncing', user, profile: null, error: null });

  try {
    const profile = await ensureUserDocument(user);
    publish({ status: 'authenticated', user, profile, error: null });
  } catch (error) {
    console.error('Failed to initialize the user session.', error);
    publish({ status: 'error', user, profile: null, error });
  }
});
