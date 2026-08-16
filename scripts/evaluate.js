import { readFile, writeFile } from 'node:fs/promises';

const SEED_PATH = new URL('../seed/seed.json', import.meta.url);
const OUTPUT_PATH = new URL('../seed/evaluation.json', import.meta.url);
const LABELS = ['truthful', 'deceptive', 'ai'];
const BINS = [
  { name: '0-39 suspicious', test: (score) => score >= 0 && score <= 39 },
  { name: '40-69 uncertain', test: (score) => score >= 40 && score <= 69 },
  { name: '70-100 trusted', test: (score) => score >= 70 && score <= 100 }
];

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function main() {
  const seed = JSON.parse(await readFile(SEED_PATH, 'utf8'));
  const matrix = Object.fromEntries(LABELS.map((label) => [label, Object.fromEntries([
    ...BINS.map((bin) => [bin.name, 0]),
    ['unscored', 0]
  ])]));

  for (const review of seed.reviews) {
    const row = matrix[review.label];
    if (!row) throw new Error(`Unexpected label: ${review.label}`);
    const bin = review.aiScore == null ? null : BINS.find((candidate) => candidate.test(review.aiScore));
    row[bin?.name || 'unscored'] += 1;
  }

  const summaries = Object.fromEntries(LABELS.map((label) => {
    const scores = seed.reviews
      .filter((review) => review.label === label && review.aiScore != null)
      .map((review) => review.aiScore);
    return [label, {
      count: scores.length,
      mean: scores.length ? Number(mean(scores).toFixed(2)) : null,
      median: scores.length ? median(scores) : null
    }];
  }));

  const scored = seed.reviews.filter((review) => review.aiScore != null);
  const threshold = 50;
  const metrics = scored.reduce((result, review) => {
    const actualFake = review.label !== 'truthful';
    const predictedFake = review.aiScore < threshold;
    if (actualFake && predictedFake) result.truePositive += 1;
    if (!actualFake && predictedFake) result.falsePositive += 1;
    if (actualFake && !predictedFake) result.falseNegative += 1;
    if (!actualFake && !predictedFake) result.trueNegative += 1;
    return result;
  }, { truePositive: 0, falsePositive: 0, falseNegative: 0, trueNegative: 0 });

  const precision = metrics.truePositive / Math.max(1, metrics.truePositive + metrics.falsePositive);
  const recall = metrics.truePositive / Math.max(1, metrics.truePositive + metrics.falseNegative);
  const result = {
    generatedAt: new Date().toISOString(),
    totalReviews: seed.reviews.length,
    scoredReviews: scored.length,
    scoreBins: matrix,
    labelSummary: summaries,
    binaryThreshold: threshold,
    binaryMetrics: {
      ...metrics,
      accuracy: Number(((metrics.truePositive + metrics.trueNegative) / Math.max(1, scored.length)).toFixed(4)),
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number((2 * precision * recall / Math.max(Number.EPSILON, precision + recall)).toFixed(4))
    }
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.table(matrix);
  console.table(summaries);
  console.log(result.binaryMetrics);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
