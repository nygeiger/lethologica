import z from "zod"
import type { Request, Response } from "express"
import { dbGetNextWord, dbGetUserHistory, dbGetUserWordProg, dbUpdateUserWordProg, dbGetRandomWords } from "./words.services.js"
import { calculateSM2 } from "./sm2.js"
import type { JoinedWordAndUWPResult, UserWordProgress } from "./types.js"
import logger from "../../utils/logger.js"

const updateWordSchema = z.object({
    wordId: z.coerce.number(),
    rating: z.coerce.number().min(0).max(5)
})

const randomQuerySchema = z.object({
    exclude: z.coerce.number(),
    limit: z.coerce.number()
})

export async function getNextWord(req: Request, res: Response) {
    try {
        logger.debug("In getNextWord")
        const wordResult = (await dbGetNextWord(req.user!.userId)).rows[0]
        if (!wordResult) {
            res.status(404).json({ message: "No words available" })
            return
        }
        res.status(200).json(wordResult)
    } catch (err) {
        logger.error(err, "Error retrieving word")
        res.status(500).json("Error retrieving word")
    }
}

export async function updateWordProgress(req: Request, res: Response) {
    try {
        logger.debug("in updateWordProgress")
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
        logger.error(err, "error updating word")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "error updating word" })
    }
}

export async function getUserHistory(req: Request, res: Response) {
    logger.debug("in getUserHistory")
    try {
        const userId = req.user!.userId
        const wordHistory: JoinedWordAndUWPResult[] = (await dbGetUserHistory(userId)).rows
        if (!wordHistory[0]) {
            res.status(200).json([])
            return
        }
        logger.debug(wordHistory, "printing user history")
        res.status(200).json(wordHistory)
    } catch (err) {
        logger.error(err, "Error fetching word history")
        res.status(500).json({ message: "Error fetching word history" })
    }
}

export async function getRandomWords(req: Request, res: Response) {
    try {
        const randomQueryReq = randomQuerySchema.parse(req.query)
        const rows = (await dbGetRandomWords(randomQueryReq.exclude, randomQueryReq.limit)).rows
        res.status(200).json(rows)
    } catch (err) {
        logger.error(err, "Error fetching random words")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Error fetching random words" })
    }
}