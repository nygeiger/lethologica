import type { UserWordProgress } from "./types.js";

type UpdatedProgress = UserWordProgress

/**
 * Calculates the next review state for a word using the SM-2 spaced repetition algorithm.
 *
 * SM-2 is the same core algorithm used by Anki: after a learner rates how well they recalled
 * a word (0-5), the system updates the review interval and ease factor so high-confidence
 * words are revisited less frequently and weak words are revisited sooner.
 *
 * @param progress The user's current progress record for the word. This includes the prior
 * ease factor, interval, review counts, and timestamps used to compute the next review.
 * @param rating The self-reported recall score from 0 to 5, where 0 is total blackout and
 * 5 is perfect recall.
 * @returns A new progress object with the updated interval, next review timestamp, review
 * counters, and `last_reviewed_at` timestamp. The returned object keeps all existing fields
 * from `progress` and updates the values relevant to the next review cycle.
 *
 * @remarks The ease factor is clamped with a minimum floor of `1.3`, which prevents the
 * algorithm from driving a card to an unrealistically low retention multiplier. The interval
 * is scheduled as:
 * - `1` day for ratings below 3
 * - `1` day for the first two reviews, regardless of rating
 * - `6` days after the third review if the learner got it right
 * - otherwise the previous interval multiplied by the new ease factor and rounded
 */
export function calculateSM2(progress: UserWordProgress, rating: number): UpdatedProgress {
    const next_review_at = new Date()
    const new_ease_factor = Math.max(progress.ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)), 1.3)
    let new_interval_days = 1

    if (rating < 3) {
        new_interval_days = 1
    } else if (progress.times_reviewed === 0 || progress.times_reviewed === 1) {
        new_interval_days = 1
    } else if (progress.times_reviewed === 2) {
        new_interval_days = 6
    } else {
        new_interval_days = Math.round(progress.interval_days * new_ease_factor)// (rounded)
    }
    next_review_at.setDate(next_review_at.getDate() + new_interval_days)

    return {
        ...progress, interval_days: new_interval_days, next_review_at: next_review_at.toISOString(),
        times_reviewed: progress.times_reviewed + 1,
        times_correct: rating >= 3 ? progress.times_correct + 1 : progress.times_correct,
        last_reviewed_at: new Date().toISOString()
    }
}