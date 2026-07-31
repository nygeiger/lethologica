import z from "zod"

export const userWordProgressSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    word_id: z.coerce.number(),
    ease_factor: z.coerce.number(),
    interval_days: z.coerce.number(),
    next_review_at: z.string(),
    last_reviewed_at: z.string(),
    times_reviewed: z.coerce.number(),
    times_correct: z.coerce.number()
})
export type UserWordProgress = z.infer<typeof userWordProgressSchema>;

export const wordSchema = z.object({
    id: z.coerce.number(),
    word: z.string(),
    def: z.string(),
    example: z.string(),
    pronunciation_url: z.string()
});
export type Word = z.infer<typeof wordSchema>;

export const JoinedWordAndUWPResultSchema = z.array(z.object({word: wordSchema, uwp: userWordProgressSchema }))
export type JoinedWordAndUWPResult = z.infer<typeof JoinedWordAndUWPResultSchema>;
