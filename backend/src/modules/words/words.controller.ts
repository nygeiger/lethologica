import z from "zod"
import type { Request, Response } from "express"
import { dbGetNextWord, dbGetUserHistory, dbGetUserWordProg, dbUpdateUserWordProg } from "./words.services.js"
import { calculateSM2 } from "./sm2.js"
import type { UserWordProgress, Word } from "./types.js"

const updateWordSchema = z.object({
    wordId: z.coerce.number(),
    rating: z.number()
})

export async function getNextWord(req: Request, res: Response) {
    try {
        const wordResult = (await dbGetNextWord(req.user!.userId)).rows[0]
        if (!wordResult) {
            res.status(404).json({ message: "No words available" })
            return
        }
        res.status(200).json(wordResult)
    } catch (err) {
        res.status(500).json("Error retrieving word")
    }
}

export async function updateWordProgress(req: Request, res: Response) {
    try {
        const userId = req.user!.userId
        const updateWordReq = updateWordSchema.parse({ ...req.params, ...req.body })
        const wordProgress = (await dbGetUserWordProg(userId, updateWordReq.wordId)).rows[0]
            ?? {
                id: "",
                user_id: userId,
                word_id: updateWordReq.wordId,
                ease_factor: 2.5,
                interval_days: 1,
                next_review_at: new Date().toISOString(),
                last_reviewed_at: new Date().toISOString(),
                times_reviewed: 0,
                times_correct: 0
            } satisfies UserWordProgress

        const updatedWordProgress = calculateSM2(wordProgress, updateWordReq.rating)
        await dbUpdateUserWordProg(updatedWordProgress) // * id will be blank on insert
        res.status(200).json(updatedWordProgress)
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({message: "error updating word"})
    }
}

export async function getUserHistory(req: Request, res: Response) {
    try {
        const userId = req.user!.userId
        const wordHistory: Word[] = (await dbGetUserHistory(userId)).rows
        if (!wordHistory) {
            res.status(404).json({message: "Now history available"})
            return
        }
        res.status(200).json(wordHistory)
    } catch (err) {
        res.status(500).json({message: "Error fetching word history"})
    }
}