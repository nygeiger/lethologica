import { dbQuery } from "../../config/db.js"
import type { Word } from "../words/types.js"
import type { List } from "./types.js"

export const dbGetLists = (userId: string) => {
    const queryParams = [userId]
    return dbQuery<List>(
        `SELECT lists.*,
            CASE
                WHEN lists.owner_id = $1 THEN true
                WHEN EXISTS (
                    SELECT 1 FROM list_shares ls WHERE ls.list_id = lists.id AND ls.shared_with_user_id = $1 AND ls.role IN ('owner','editor')
                ) THEN true
                ELSE false
            END as can_edit
        FROM lists
        WHERE lists.owner_id = $1
           OR EXISTS (SELECT 1 FROM list_shares s WHERE s.list_id = lists.id AND s.shared_with_user_id = $1)
        ORDER BY lists.created_at DESC`, queryParams)
}

export const dbGetList = (userId: string, listId: string) => {
    const queryParams = [userId, listId]
    return dbQuery<List>(
        `SELECT lists.*,
            CASE
                WHEN lists.owner_id = $1 THEN true
                WHEN EXISTS (
                    SELECT 1 FROM list_shares ls WHERE ls.list_id = lists.id AND ls.shared_with_user_id = $1 AND ls.role IN ('owner','editor')
                ) THEN true
                ELSE false
            END as can_edit
        FROM lists
        WHERE lists.id = $2
          AND (lists.owner_id = $1 OR EXISTS (SELECT 1 FROM list_shares s WHERE s.list_id = lists.id AND s.shared_with_user_id = $1))`, queryParams
    )
}

export const dbGetListWords = (listId: string) => {
    const queryParams = [listId]
    return dbQuery<Word[]>(
        `SELECT w.*
        FROM list_words lw
        JOIN words w ON w.id = lw.word_id
        WHERE lw.list_id = $1`, queryParams
    )
}

export const dbCreateList = (ownerId: string, listName: string) => {
    const queryParams = [listName, ownerId]
    return dbQuery<List>(
        `INSERT INTO lists (list_name, owner_id) VALUES ($1, $2) RETURNING *`, queryParams
    )
}

export const dbAddWordToList = (listId: string, wordId: number) => {
    const queryParams = [listId, wordId]
    return dbQuery<{ word: string, list_name: string }>(
        `WITH added_word AS (
            INSERT INTO list_words (list_id, word_id) VALUES ($1, $2)
            RETURNING list_id, word_id
        )
        SELECT w.word, l.list_name
        FROM added_word
        JOIN words w ON w.id = added_word.word_id
        JOIN lists l ON l.id = added_word.list_id`, queryParams
    )
}

export const dbRenameList = (listId: string, newName: string) => {
    const queryParams = [listId, newName]
    return dbQuery<List>(`UPDATE lists SET list_name=$2 WHERE id=$1 RETURNING *`, queryParams)
}

export const dbDeleteList = (listId: string) => {
    const queryParams = [listId]
    return dbQuery<List>(`DELETE FROM lists WHERE id=$1 RETURNING *`, queryParams)
}

export const dbRemoveWordFromList = (listId: string, wordId: number) => {
    const queryParams = [listId, wordId]
    return dbQuery<{ word: string, list_name: string }>(
        `WITH removed_word AS (
            DELETE FROM list_words WHERE list_id=$1 AND word_id=$2 RETURNING list_id, word_id
        )
        SELECT w.word, l.list_name
        FROM removed_word
        JOIN words w ON w.id = removed_word.word_id
        JOIN lists l ON l.id = removed_word.list_id`, queryParams
    )
}