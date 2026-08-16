import { readFile, writeFile } from 'node:fs/promises';
import { requestJson, requireOpenRouterKey, withRetry } from './lib/openrouter.js';

const MODEL = 'openai/gpt-5.6-luna';
const SEED_PATH = new URL('../seed/seed.json', import.meta.url);
const PROMPT_PATH = new URL('../prompts/score.md', import.meta.url);
const BATCH_SIZE = 5;
const CONCURRENCY = 15;

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function validateResults(payload, reviews) {
  if (!Array.isArray(payload?.results)) {
    throw new Error('Scoring response must include a results array.');
  }

  const expected = new Set(reviews.map((review) => review.id));
  const normalized = payload.results.map((result) => ({
    id: String(result.id),
    score: Math.max(0, Math.min(100, Math.round(Number(result.score)))),
    reasons: Array.isArray(result.reasons) ? result.reasons.map(String).map((value) => value.trim()) : []
  }));

  if (normalized.length !== reviews.length
      || normalized.some((result) => !expected.has(result.id))
      || normalized.some((result) => !Number.isFinite(result.score) || result.reasons.length !== 3)) {
    throw new Error('Scoring response does not match the requested review IDs and schema.');
  }

  return normalized;
}

async function scoreBatch(rubric, hotel, reviews, usersById) {
  const publicReviews = reviews.map((review) => {
    const user = usersById.get(review.uid) || {};
    return {
      id: review.id,
      rating: review.rating,
      text: review.text,
      author: {
        verified: Boolean(user.verified),
        trustedCount: Number(user.trustedCount || 0)
      }
    };
  });

  const userPrompt = [
    rubric,
    '',
    `Hotel: ${hotel.name}, ${hotel.city}`,
    `Description: ${hotel.description}`,
    '',
    'Score all five reviews independently. Return one result for every supplied id.',
    JSON.stringify({ reviews: publicReviews })
  ].join('\n');

  const payload = await withRetry(() => requestJson({
    model: MODEL,
    reasoningEffort: 'low',
    maxTokens: 4000,
    messages: [
      { role: 'system', content: 'You are a calibrated review-integrity classifier. Output valid JSON only.' },
      { role: 'user', content: userPrompt }
    ]
  }), 1);

  return validateResults(payload, reviews);
}

async function main() {
  requireOpenRouterKey();
  const [seedText, rubric] = await Promise.all([
    readFile(SEED_PATH, 'utf8'),
    readFile(PROMPT_PATH, 'utf8')
  ]);
  const seed = JSON.parse(seedText);

  if (seed.reviews.length !== 2000) {
    throw new Error(`Prescoring requires 2000 reviews; received ${seed.reviews.length}.`);
  }

  const usersById = new Map(seed.users.map((user) => [user.uid, user]));
  const reviewById = new Map(seed.reviews.map((review) => [review.id, review]));
  const tasks = seed.hotels.flatMap((hotel) => {
    const hotelReviews = seed.reviews.filter((review) => review.hotelId === hotel.id);
    if (hotelReviews.length !== 100) {
      throw new Error(`${hotel.id} must contain exactly 100 reviews before scoring.`);
    }
    return chunks(hotelReviews, BATCH_SIZE).map((reviews) => ({ hotel, reviews }));
  });

  for (let offset = 0; offset < tasks.length; offset += CONCURRENCY) {
    const group = tasks.slice(offset, offset + CONCURRENCY);
    const settled = await Promise.all(group.map(async (task) => {
      const unscored = task.reviews.filter((review) => review.aiScore == null);
      if (!unscored.length) return { results: [], failed: [] };

      try {
        const results = await scoreBatch(rubric, task.hotel, unscored, usersById);
        return { results, failed: [] };
      } catch (error) {
        console.error(`Scoring failed for ${task.hotel.id}:`, error.message);
        return { results: [], failed: unscored.map((review) => review.id) };
      }
    }));

    for (const outcome of settled) {
      for (const result of outcome.results) {
        const review = reviewById.get(result.id);
        review.aiScore = result.score;
        review.aiReason = result.reasons;
      }
      for (const id of outcome.failed) {
        const review = reviewById.get(id);
        review.aiScore = null;
        review.aiReason = [];
      }
    }

    await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
    const scored = seed.reviews.filter((review) => review.aiScore != null).length;
    console.log(`Progress: ${scored}/2000 reviews scored.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
