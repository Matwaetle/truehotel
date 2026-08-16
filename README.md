# TRUE REVIEW

TRUE REVIEW is a mobile-first trust layer for the fictional HotelHansung review platform. It contrasts text-only AI detection with a user-controlled trust graph over the same hotel-review corpus.

The deployed app uses static HTML, browser ES modules, Tailwind CDN, Firebase Authentication and Firestore, plus a Vercel serverless OpenRouter proxy. There is no frontend build step.

## Local data pipeline

1. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`. Never commit `.env`.
2. Run `npm install`.
3. Run `npm run seed:build` to transform the source CSV into `seed/seed.json`.
4. Run `npm run seed:generate-ai` to add 400 GPT-5.6 Sol reviews.
5. Run `npm run seed:prescore` to score all 2,000 reviews with GPT-5.6 Luna.
6. Run `npm run seed:evaluate` to create the presentation metrics.
7. Place the Firebase service account at `seed/serviceAccount.json`, then run `npm run seed:inject`.

The hidden `label` field is evaluation ground truth and must never be rendered in the product UI.

## Dataset and citation

`data/deceptive-opinion.csv` is the Deceptive Opinion Spam Corpus v1.4. It contains 1,600 English reviews across 20 Chicago hotels. This project uses only the committed copy of the dataset.

- Myle Ott, Yejin Choi, Claire Cardie, and Jeffrey T. Hancock. 2011. *Finding Deceptive Opinion Spam by Any Stretch of the Imagination.* ACL.
- Myle Ott, Claire Cardie, and Jeffrey T. Hancock. 2013. *Negative Deceptive Opinion Spam.* NAACL-HLT.

Original distribution: <http://myleott.com/op-spam.html>
