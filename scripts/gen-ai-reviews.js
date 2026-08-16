import { readFile, writeFile } from 'node:fs/promises';
import { requestJson, requireOpenRouterKey, withRetry } from './lib/openrouter.js';

const MODEL = 'openai/gpt-5.6-sol';
const SEED_PATH = new URL('../seed/seed.json', import.meta.url);
const GROUP_CONCURRENCY = 3;

function taskId(hotelId, polarity) {
  return `${hotelId}-${polarity}`;
}

function expectedIds(hotelId, polarity) {
  return Array.from({ length: 10 }, (_, index) =>
    `review-ai-${hotelId}-${polarity}-${String(index + 1).padStart(2, '0')}`
  );
}

function validateGenerated(payload) {
  if (!Array.isArray(payload?.reviews) || payload.reviews.length !== 10) {
    throw new Error('The model must return an object with exactly 10 reviews.');
  }

  const reviews = payload.reviews.map((value) => String(value).trim());
  if (reviews.some((review) => review.length < 80 || review.length > 1800)) {
    throw new Error('Every generated review must contain 80 to 1800 characters.');
  }
  if (new Set(reviews).size !== reviews.length) {
    throw new Error('The model returned duplicate reviews.');
  }
  return reviews;
}

async function generateTask(seed, hotel, polarity, taskIndex) {
  const referenceCandidates = seed.reviews.filter((review) =>
    review.hotelId === hotel.id
    && review.label === 'truthful'
    && (polarity === 'positive' ? review.rating >= 4 : review.rating <= 2)
  );
  const reference = referenceCandidates[taskIndex % referenceCandidates.length];

  const prompt = [
    `Hotel: ${hotel.name}, ${hotel.city}`,
    `Hotel description: ${hotel.description}`,
    `Target sentiment: ${polarity}`,
    '',
    'A real guest wrote this reference review:',
    `<reference>${reference.text}</reference>`,
    '',
    'Write exactly 10 new English hotel reviews for the same hotel.',
    'Match the reference review’s general tone and level of detail, but describe different stays and different concrete events.',
    'Do not copy phrases, names, dates, room numbers, or anecdotes from the reference.',
    'Avoid glossy marketing language, generic superlatives, balanced essay structure, and repetitive conclusions.',
    'Every review must include at least one small inconvenience, awkward detail, uncertainty, or mundane observation.',
    'Vary length, rhythm, grammar, and formatting so the reviews appear to come from different ordinary guests.',
    `Keep the overall sentiment ${polarity}.`,
    'Return JSON only in this exact shape: {"reviews":["...", "..."]}.'
  ].join('\n');

  const payload = await withRetry(() => requestJson({
    model: MODEL,
    reasoningEffort: 'medium',
    maxTokens: 10000,
    messages: [
      { role: 'system', content: 'You create realistic research data for deceptive-review detection. Follow the requested JSON schema exactly.' },
      { role: 'user', content: prompt }
    ]
  }), 1);

  const generated = validateGenerated(payload);
  const ids = expectedIds(hotel.id, polarity);

  return generated.map((text, index) => {
    const user = seed.users[(taskIndex * 5 + index) % seed.users.length];
    return {
      id: ids[index],
      hotelId: hotel.id,
      uid: user.uid,
      nickname: user.nickname,
      rating: polarity === 'positive' ? 4 + (index % 2) : 1 + (index % 2),
      text,
      createdAt: new Date(Date.UTC(2026, 6, 1, 12) + (taskIndex * 10 + index) * 60 * 60 * 1000).toISOString(),
      aiScore: null,
      aiReason: [],
      source: 'OpenAI via OpenRouter',
      label: 'ai'
    };
  });
}

async function main() {
  requireOpenRouterKey();
  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'));
  if (seed.reviews.filter((review) => review.label !== 'ai').length !== 1600) {
    throw new Error('seed.json must contain exactly 1600 non-AI source reviews.');
  }

  const tasks = seed.hotels.flatMap((hotel) => ['positive', 'negative'].map((polarity) => ({
    hotel,
    polarity,
    id: taskId(hotel.id, polarity)
  })));

  for (let offset = 0; offset < tasks.length; offset += GROUP_CONCURRENCY) {
    const group = tasks.slice(offset, offset + GROUP_CONCURRENCY);
    const generatedGroups = await Promise.all(group.map(async (task, groupIndex) => {
      const ids = expectedIds(task.hotel.id, task.polarity);
      if (ids.every((id) => seed.reviews.some((review) => review.id === id))) {
        console.log(`Skipping completed task ${task.id}.`);
        return null;
      }

      seed.reviews = seed.reviews.filter((review) => !ids.includes(review.id));
      console.log(`Generating ${task.id} with ${MODEL}...`);
      return generateTask(seed, task.hotel, task.polarity, offset + groupIndex);
    }));

    generatedGroups.filter(Boolean).forEach((reviews) => seed.reviews.push(...reviews));
    await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
    console.log(`Progress: ${seed.reviews.filter((review) => review.label === 'ai').length}/400 AI reviews.`);
  }

  const aiCount = seed.reviews.filter((review) => review.label === 'ai').length;
  if (seed.reviews.length !== 2000 || aiCount !== 400) {
    throw new Error(`Expected 2000 total reviews and 400 AI reviews; received ${seed.reviews.length} and ${aiCount}.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
