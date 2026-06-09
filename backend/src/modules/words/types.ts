export type UserWordProgress = {
    id: string
    user_id: string
    word_id: number
    ease_factor: number
    interval_days: number
    next_review_at: string
    last_reviewed_at: string
    times_reviewed: number
    times_correct: number
}

export type Word = {
    id: number
    word: string
    def: string,
    example: string
    pronunciation_url: string
}