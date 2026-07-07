import type { Request, Response } from "express";
import { dbAddWordToList, dbCreateList, dbDeleteList, dbGetList, dbGetLists, dbRemoveWordFromList, dbRenameList } from "./lists.services.js";
import z from "zod"
import env from "../../config/env.js";

const getListSchema = z.object({
    userId: z.string(),
    listId: z.string()
})

const createListSchema = z.object({
    userId: z.string(),
    listName: z.string()
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
        if (env.NODE_ENV !== "production") console.log("In get all lists")
        const lists = await dbGetLists(req.user!.userId)
        if (env.NODE_ENV !== "production") console.log("lists: ", lists)
        if (!lists.rowCount) {
            res.status(404).json({ message: "No lists found" })
            return
        }
        res.status(200).json(lists.rows)
    } catch (err) {
        if (env.NODE_ENV !== "production") console.log(err)
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
        if (env.NODE_ENV !== "production") console.log("In get list")

        const listReq = getListSchema.parse({ ...req.user!, ...req.params })
        const list = await dbGetList(listReq.userId, listReq.listId)
        if (env.NODE_ENV !== "production") console.log("list: ", list)
        if (!list.rowCount) {
            res.status(404).json({ message: "No list found" })
            return
        }
        res.status(200).json(list.rows[0])
    } catch (err) {
        if (env.NODE_ENV !== "production") console.log(err)
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
        if (env.NODE_ENV !== "production") console.log("in createList")

        const createListRq = createListSchema.parse({ ...req.user!, ...req.body })
        const newList = await dbCreateList(createListRq.userId, createListRq.listName)
        if (env.NODE_ENV !== "production") console.log("createdList: ", newList)
        res.status(201).json({ message: `List "${newList.rows[0]?.list_name}" created successfully` })
    } catch (err) {
        if (env.NODE_ENV !== "production") console.log(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Failed to create list" })
    }
}

export async function addWordToList(req: Request, res: Response) {
    try {
        if (env.NODE_ENV !== "production") console.log("in addWordToList")
        const createListRq = addWordToListSchema.parse({ ...req.params })
        const addedWord = await dbAddWordToList(createListRq.listId, createListRq.wordId)
        if (env.NODE_ENV !== "production") console.log("addedWord: ", addedWord)
        res.status(201).json({ message: `${addedWord.rows[0]?.word} added to ${addedWord.rows[0]!.list_name} successfully` })
    } catch (err) {
        if (env.NODE_ENV !== "production") console.log(err)
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            if (err.code === "23505") {
                res.status(200).json({message: "Word already in list"})
                return
            }
            res.status(500).json(err.code)
            return
        }
        res.status(404).json({ message: "Failed to add word to list" })
    }
}

export async function renameList(req: Request, res: Response) {
    try {
        if (env.NODE_ENV !== "production") console.log("in renameList")

        const renameListReq = renameListSchema.parse({ ...req.params, ...req.body })
        const list = await dbRenameList(renameListReq.listId, renameListReq.newName)
        res.status(200).json({ message: `Renamed list to "${list.rows[0]?.list_name}" successfully` })
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
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
        if (env.NODE_ENV !== "production") console.log("in deleteList")

        const deleteListReq = deleteListSchema.parse({ ...req.params })
        const deletedList = await dbDeleteList(deleteListReq.listId)
        if (env.NODE_ENV !== "production") console.log("deleteList: ", deletedList)
        res.status(200).json({ message: `Deleted "${deletedList.rows[0]!.list_name}" successfully` })
    } catch (err) {
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
        if (env.NODE_ENV !== "production") console.log("in removeWordFromList")

        const removeWordReq = removeWordSchema.parse({ ...req.params })
        const removedWord = await dbRemoveWordFromList(removeWordReq.listId, removeWordReq.wordId)
        res.status(200).json({ message: `Removed ${removedWord.rows[0]?.word} from ${removedWord.rows[0]?.list_name} successfully` })
    } catch (err) {
        if (env.NODE_ENV !== "production") console.log(err)
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