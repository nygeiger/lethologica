import { dbQuery } from "../../config/db.js"
import type { JoinedWordAndUWPResult, UserWordProgress, Word } from "./types.js"

//* If the two tables had conflicting columns, they would overwrite each other
type WordQueryResult = Word & Partial<UserWordProgress>

const dbGetTodaysWord = (queryParams: string[]) => {
    return dbQuery<WordQueryResult>(
        `SELECT w.*, uwp.*
        FROM user_word_progress as uwp
        JOIN words as w ON w.id = uwp.word_id
        WHERE uwp.user_id=$1 AND uwp.next_review_at<=NOW()
        ORDER BY uwp.next_review_at ASC
        LIMIT 1`, queryParams)
}

const dbGetUnseenWord = (queryParams: string[]) => {
    return dbQuery<WordQueryResult>(
        `SELECT * FROM words
        WHERE NOT EXISTS (
        SELECT id from user_word_progress as uwp
        WHERE uwp.word_id=words.id AND uwp.user_id=$1 )
        ORDER BY words.id ASC
        LIMIT 1`, queryParams)
}

//* Will return a word before it's technically due. Run this only after all words are seen
const dbGetNextSeenWord = (queryParams: string[]) => {
    return dbQuery<WordQueryResult>(
        `SELECT w.*, uwp.*
        FROM user_word_progress as uwp
        JOIN words as w ON w.id = uwp.word_id
        WHERE uwp.user_id=$1
        ORDER BY uwp.next_review_at ASC
        LIMIT 1`, queryParams)
}

export const dbGetNextWord = async (userId: string) => {
    const queryParams = [userId]
    let nextWord = await dbGetTodaysWord(queryParams)
    if (nextWord.rowCount) {
        return nextWord
    }
    nextWord = await dbGetUnseenWord(queryParams)
    if (nextWord.rowCount) {
        return nextWord
    }
    return dbGetNextSeenWord(queryParams)
}

export const dbGetUserWordProg = (userId: string, wordId: number) => {
    const queryParams = [userId, wordId]
    return dbQuery<UserWordProgress>("SELECT * FROM user_word_progress WHERE user_id=$1 AND word_id=$2", queryParams)
}

export const dbUpdateUserWordProg = (wordProgress: UserWordProgress) => {
    if (wordProgress.id) {
        const queryParams = [
            wordProgress.id,
            wordProgress.ease_factor,
            wordProgress.interval_days,
            wordProgress.next_review_at,
            wordProgress.last_reviewed_at,
            wordProgress.times_reviewed,
            wordProgress.times_correct
        ]
        return dbQuery<UserWordProgress>(
            `UPDATE user_word_progress
            SET ease_factor=$2, interval_days=$3, next_review_at=$4, last_reviewed_at=$5, times_reviewed=$6, times_correct=$7
            WHERE id=$1`, queryParams
        )
    } else {
        const queryParams = [wordProgress.user_id, wordProgress.word_id,
        wordProgress.ease_factor,
        wordProgress.interval_days,
        wordProgress.next_review_at,
        wordProgress.last_reviewed_at,
        wordProgress.times_reviewed,
        wordProgress.times_correct
        ]
        return dbQuery<UserWordProgress>(
            `INSERT INTO user_word_progress (user_id, word_id, ease_factor, interval_days, next_review_at, last_reviewed_at, times_reviewed, times_correct) Values
            ($1, $2, $3, $4, $5, $6, $7, $8)`, queryParams
        )
    }
}

export const dbGetUserHistory = async (userId: string) => {
    const queryParams = [userId]
    //TODO: Add pagination

    return dbQuery<JoinedWordAndUWPResult>(
        `SELECT to_jsonb(w.*) as word, to_jsonb(uwp.*) as uwp
        FROM user_word_progress as uwp
        JOIN words as w ON w.id = uwp.word_id
        WHERE uwp.user_id=$1
        ORDER BY uwp.next_review_at ASC`, queryParams
    )
}