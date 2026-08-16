import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { HOTELS } from '../app/hotels.js';

const INPUT = new URL('../data/deceptive-opinion.csv', import.meta.url);
const OUTPUT = new URL('../seed/seed.json', import.meta.url);
const EXPECTED_COLUMNS = ['deceptive', 'hotel', 'polarity', 'source', 'text'];

const USER_NAMES = [
  'Maya Chen', 'Noah Williams', 'Sofia Martinez', 'Ethan Park',
  'Ava Thompson', 'Lucas Brown', 'Mina Kim', 'Oliver Davis',
  'Emma Wilson', 'Leo Anderson', 'Nora Taylor', 'Henry Moore'
];

function seededNumber(input) {
  let value = 2166136261;
  for (const char of input) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function ratingFor(row, index) {
  const high = seededNumber(`${row.hotel}:${row.polarity}:${index}`) % 2;
  return row.polarity === 'positive' ? 4 + high : 1 + high;
}

function dateFor(index) {
  const first = Date.UTC(2025, 0, 4, 12);
  return new Date(first + index * 9 * 60 * 60 * 1000).toISOString();
}

function validateRows(records) {
  if (records.length !== 1600) {
    throw new Error(`Expected 1600 CSV records, received ${records.length}.`);
  }

  const columns = Object.keys(records[0] || {});
  if (columns.join('|') !== EXPECTED_COLUMNS.join('|')) {
    throw new Error(`Unexpected columns: ${columns.join(', ')}`);
  }

  const configuredHotels = new Set(HOTELS.map((hotel) => hotel.id));
  const counts = new Map();

  for (const record of records) {
    if (!configuredHotels.has(record.hotel)) {
      throw new Error(`Hotel metadata is missing for ${record.hotel}.`);
    }
    if (!['truthful', 'deceptive'].includes(record.deceptive)) {
      throw new Error(`Unexpected deceptive value: ${record.deceptive}.`);
    }
    if (!['positive', 'negative'].includes(record.polarity)) {
      throw new Error(`Unexpected polarity value: ${record.polarity}.`);
    }

    const key = `${record.hotel}:${record.deceptive}:${record.polarity}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  for (const hotel of HOTELS) {
    for (const label of ['truthful', 'deceptive']) {
      for (const polarity of ['positive', 'negative']) {
        const key = `${hotel.id}:${label}:${polarity}`;
        if (counts.get(key) !== 20) {
          throw new Error(`${key} must contain 20 reviews; received ${counts.get(key) || 0}.`);
        }
      }
    }
  }
}

function makeTrusts(users) {
  const trusts = [];
  for (let index = 0; index < 20; index += 1) {
    const from = users[index % users.length];
    const offset = index < users.length ? 1 : 3;
    const to = users[(index + offset) % users.length];
    trusts.push({
      id: `${from.uid}_${to.uid}`,
      fromUid: from.uid,
      toUid: to.uid
    });
  }
  return trusts;
}

async function main() {
  const csv = await readFile(INPUT, 'utf8');
  const records = parse(csv, {
    columns: true,
    bom: true,
    relax_quotes: false,
    skip_empty_lines: true
  });

  validateRows(records);

  const users = USER_NAMES.map((nickname, index) => ({
    uid: `seed-user-${String(index + 1).padStart(2, '0')}`,
    nickname,
    verified: index < 4,
    trustedCount: 0,
    dailyCount: 0,
    dailyDate: '2026-08-16'
  }));

  const trusts = makeTrusts(users);
  for (const trust of trusts) {
    users.find((user) => user.uid === trust.toUid).trustedCount += 1;
  }

  const reviews = records.map((record, index) => {
    const user = users[(index * 7 + HOTELS.findIndex((hotel) => hotel.id === record.hotel)) % users.length];
    return {
      id: `review-kaggle-${String(index + 1).padStart(4, '0')}`,
      hotelId: record.hotel,
      uid: user.uid,
      nickname: user.nickname,
      rating: ratingFor(record, index),
      text: record.text.trim(),
      createdAt: dateFor(index),
      aiScore: null,
      aiReason: [],
      source: record.source,
      label: record.deceptive
    };
  });

  const orders = HOTELS.map((hotel, index) => ({
    id: `order-${String(index + 1).padStart(2, '0')}`,
    uid: '',
    hotelId: hotel.id,
    orderCode: `HH-${String(index + 1).padStart(2, '0')}-2026`
  }));

  const seed = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      dataset: 'Deceptive Opinion Spam Corpus v1.4',
      citations: ['Ott et al. 2011', 'Ott et al. 2013'],
      rows: records.length
    },
    hotels: HOTELS,
    users,
    trusts,
    orders,
    reviews
  };

  await mkdir(new URL('../seed/', import.meta.url), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${reviews.length} reviews, ${users.length} users, ${orders.length} orders, and ${trusts.length} trusts.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
