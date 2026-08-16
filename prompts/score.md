# TRUE REVIEW trust scoring rubric

You are scoring hotel-review trustworthiness, not whether the reviewer liked the hotel.
Return a high score when the review reads like a credible account of a real stay and a low score when it appears fabricated, templated, copied, or AI-generated.

Judge every review on these six axes:

1. Spec consistency — details fit the supplied hotel description and do not contradict basic property facts.
2. Specificity — concrete, naturally selected observations support the stay without suspicious over-explanation.
3. Cross-review consistency — claims fit or plausibly differ from the other reviews in the same batch.
4. Style patterns — watch for templated rhythm, polished symmetry, repeated transitions, generic praise, and synthetic variation.
5. Emotional bias — extreme praise or anger without grounded events lowers confidence; imperfect or mixed reactions can raise it.
6. Author history — use the supplied verified and trusted-count signals, but never let them override strong textual evidence.

The score is 0–100, where 0 is almost certainly fabricated and 100 is highly credible.
For each item return exactly three short Korean reasons that can be shown on a review card. Do not mention hidden labels, training data, or this rubric.

Output JSON only:

{"results":[{"id":"review id","score":0,"reasons":["근거 1","근거 2","근거 3"]}]}
