import type { Request, Response } from "express";
import { dbAddWordToList, dbCreateList, dbDeleteList, dbGetList, dbGetLists, dbGetListWords, dbRemoveWordFromList, dbRenameList } from "./lists.services.js";
import z from "zod"
import logger from "../../utils/logger.js";

const getListSchema = z.object({
    userId: z.string(),
    listId: z.string()
})

const getListWordsSchema = z.object({
    listId: z.string()
})

const createListSchema = z.object({
    userId: z.string(),
    listName: z.string().min(1)
})

const addWordToListSchema = z.object({
    listId: z.string(),
    wordId: z.coerce.number()
})

const renameListSchema = z.object({
    listId: z.string(),
    newName: z.string()
})

const deleteListSchema = z.object({
    listId: z.string(),
})

const removeWordSchema = z.object({
    listId: z.string(),
    wordId: z.coerce.number()
})

export async function getAllLists(req: Request, res: Response) {
    try {
        const lists = await dbGetLists(req.user!.userId)
        if (!lists.rowCount) {
            res.status(404).json({ message: "No lists found" })
            return
        }
        res.status(200).json(lists.rows)
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Error while retrieving lists" })
    }
}

export async function getList(req: Request, res: Response) {
    try {
        const listReq = getListSchema.parse({ ...req.user!, ...req.params })
        const list = await dbGetList(listReq.userId, listReq.listId)
        if (!list.rowCount) {
            res.status(404).json({ message: "No list found" })
            return
        }
        res.status(200).json(list.rows[0])
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(404).json({ message: "No list found" })
    }
}

export async function getListWords(req: Request, res: Response) {
    try {
        const listWordsReq = getListWordsSchema.parse({ ...req.params })
        const listWords = await dbGetListWords(listWordsReq.listId)
        if (!listWords.rowCount) {
            res.status(404).json({ message: "No list found" })
            return
        }
        res.status(200).json(listWords.rows)
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(404).json({ message: "No list found" })
    }
}

export async function createList(req: Request, res: Response) {
    try {
        const createListRq = createListSchema.parse({ ...req.user!, ...req.body })
        const newList = await dbCreateList(createListRq.userId, createListRq.listName)
        res.status(201).json({ message: `List "${newList.rows[0]?.list_name}" created successfully` })
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err)
            return
        }
        if (err instanceof Error && "code" in err) {
            if (err.code === "23505") {
                res.status(500).json({ message: "List already exists" })
            }
            res.status(500).json(err)
            return
        }
        res.status(500).json({ message: "Failed to create list" })
    }
}

export async function addWordToList(req: Request, res: Response) {
    try {
        const createListRq = addWordToListSchema.parse({ ...req.params })
        const addedWord = await dbAddWordToList(createListRq.listId, createListRq.wordId)
        res.status(201).json({ message: `${addedWord.rows[0]?.word} added to ${addedWord.rows[0]!.list_name} successfully` })
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err)
            return
        }
        if (err instanceof Error && "code" in err) {
            if (err.code === "23505") {
                res.status(409).json({ message: "Word already in list" })
                return
            }
            if (err.code === "23503") {
                res.status(404).json({ message: "Unknown wordId" })
                return
            }
            res.status(500).json(err)
            return
        }
        res.status(404).json(err)
    }
}

export async function renameList(req: Request, res: Response) {
    try {
        const renameListReq = renameListSchema.parse({ ...req.params, ...req.body })
        const list = await dbRenameList(renameListReq.listId, renameListReq.newName)
        res.status(200).json({ message: `Renamed list to "${list.rows[0]?.list_name}" successfully` })
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Failed to rename list" })
    }
}

export async function deleteList(req: Request, res: Response) {
    try {
        const deleteListReq = deleteListSchema.parse({ ...req.params })
        const deletedList = await dbDeleteList(deleteListReq.listId)
        res.status(200).json({ message: `Deleted "${deletedList.rows[0]!.list_name}" successfully` })
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Failed to delete list" })
    }
}

export async function removeWordFromList(req: Request, res: Response) {
    try {

        const removeWordReq = removeWordSchema.parse({ ...req.params })
        const removedWordResult = await dbRemoveWordFromList(removeWordReq.listId, removeWordReq.wordId)
        if (!removedWordResult.rowCount) {
            res.status(404).json({message: "word not found in list"})
            return
        }
        res.status(200).json({ message: `Removed ${removedWordResult.rows[0]?.word} from ${removedWordResult.rows[0]?.list_name} successfully` })
    } catch (err) {
        logger.error(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Failed to remove word from list" })
    }
}