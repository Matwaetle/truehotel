import 'dotenv/config';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const SEED_PATH = new URL('./seed.json', import.meta.url);
const DEFAULT_CREDENTIAL_PATH = new URL('./serviceAccount.json', import.meta.url);
const PROJECT_ID = 'unodostres-94c3d';
const BATCH_LIMIT = 450;
const DRY_RUN = process.argv.includes('--dry-run');

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function validateSeed(seed) {
  const expected = {
    hotels: 20,
    reviews: 2000,
    users: 12,
    trusts: 20,
    orders: 20
  };

  for (const [key, count] of Object.entries(expected)) {
    if (!Array.isArray(seed[key]) || seed[key].length !== count) {
      throw new Error(`${key} must contain exactly ${count} documents before injection.`);
    }
  }

  const aiCount = seed.reviews.filter((review) => review.label === 'ai').length;
  const scoredCount = seed.reviews.filter((review) => review.aiScore != null).length;
  if (aiCount !== 400 || scoredCount !== 2000) {
    throw new Error(`Injection requires 400 AI reviews and 2000 scores; received ${aiCount} and ${scoredCount}.`);
  }
}

async function loadCredential() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const credentialPath = configuredPath || DEFAULT_CREDENTIAL_PATH;
  await access(credentialPath, constants.R_OK).catch(() => {
    throw new Error('Firebase service account not found. Place it at seed/serviceAccount.json or set FIREBASE_SERVICE_ACCOUNT.');
  });
  return JSON.parse(await readFile(credentialPath, 'utf8'));
}

async function deleteCollection(db, collectionName) {
  const references = await db.collection(collectionName).listDocuments();
  for (const group of chunks(references, BATCH_LIMIT)) {
    const batch = db.batch();
    group.forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
  console.log(`Deleted ${references.length} existing ${collectionName} documents.`);
}

async function writeCollection(db, collectionName, records, transform = (value) => value) {
  for (const group of chunks(records, BATCH_LIMIT)) {
    const batch = db.batch();
    for (const record of group) {
      const { id, ...data } = transform(record);
      batch.set(db.collection(collectionName).doc(id), data);
    }
    await batch.commit();
  }
  console.log(`Wrote ${records.length} ${collectionName} documents.`);
}

async function main() {
  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'));
  validateSeed(seed);

  if (DRY_RUN) {
    console.log('Seed validation passed. No Firestore writes were performed.');
    return;
  }

  const serviceAccount = await loadCredential();
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  }
  const db = getFirestore();

  for (const collectionName of ['reviews', 'trusts', 'orders', 'users', 'hotels']) {
    await deleteCollection(db, collectionName);
  }

  await writeCollection(db, 'hotels', seed.hotels);
  await writeCollection(db, 'users', seed.users);
  await writeCollection(db, 'trusts', seed.trusts);
  await writeCollection(db, 'orders', seed.orders);
  await writeCollection(db, 'reviews', seed.reviews, (review) => ({
    ...review,
    createdAt: Timestamp.fromDate(new Date(review.createdAt))
  }));

  console.log(`Seed injection complete for ${PROJECT_ID}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
