import type { UserWordProgress } from "./types.js";

/*
The Algorithm — SM-2
This is the algorithm Anki uses. How it works:
After a user sees a word, they rate how well they knew it on a scale of 0–5:

0 — complete blackout
1 — wrong, but the answer felt familiar
2 — wrong, but easy to recall after seeing it
3 — correct, but required significant effort
4 — correct with minor hesitation
5 — perfect recall

The algorithm then calculates two things — the interval (how many days until you see it again) and the ease factor (a multiplier that adjusts based on performance):
*/

type UpdatedProgress = UserWordProgress

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