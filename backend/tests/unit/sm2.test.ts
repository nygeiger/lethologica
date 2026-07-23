import { describe, it, expect } from 'vitest'
import { calculateSM2 } from '../../src/modules/words/sm2.js'

const baseProgress = {
    id: 'test-id',
    user_id: 'user-id',
    word_id: 1,
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date().toISOString(),
    last_reviewed_at: new Date().toISOString(),
    times_reviewed: 0,
    times_correct: 0
}

describe('calculateSM2', () => {
    it('increments times_correct by 1 if and only if given a correct answer', () => {
        const result = calculateSM2({ ...baseProgress, times_correct: 3 }, 3)
        const result2 = calculateSM2(baseProgress, 2)
        expect(result.times_correct).toBe(4)
        expect(result2.times_correct).toBe(baseProgress.times_correct)
    })

    it('resets interval to 1 day on wrong answer', () => {
        const result = calculateSM2({ ...baseProgress, interval_days: 6 }, 2)
        expect(result.interval_days).toBe(1)
    })

    it('ease_factor is never below 1.3', () => {
        const result = calculateSM2(baseProgress, 0)
        expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
    })

    it('increments times_reviewed by 1 regardless of rating', () => {
        const result = calculateSM2(baseProgress, 5)
        expect(result.times_reviewed).toBe(1)
    })

    it('First review (times_reviewed === 0) sets interval_days to 1', () => {
        const result = calculateSM2(baseProgress, 5)
        expect(result.interval_days).toBe(1)
    })

    it('Third review (times_reviewed === 2) sets interval_days to 6', () => {
        const result = calculateSM2({ ...baseProgress, times_reviewed: 2 }, 5)
        expect(result.interval_days).toBe(6)
    })

    it('next_review_at is always in the future', () => {
        const currentTime = new Date()
        const result = calculateSM2(baseProgress, 5)
        expect(new Date(result.next_review_at).getTime()).toBeGreaterThan(currentTime.getTime())
    })
})