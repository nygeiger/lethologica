import type { Request, Response } from "express";
import z from "zod";
import { dbAddListShare, dbDeleteListShare, dbGetListShares, dbUpdateListSharePermission } from "./shares.services.js";
import { roles } from "../lists/types.js";
import logger from "../../utils/logger.js";

const getSharesSchema = z.object({
    listId: z.string(),
})

const addShareSchema = z.object({
    listId: z.string(),
    userEmail: z.email(),
    role: z.enum(roles.filter((v) => v !== "owner"))
})

const updateShareSchema = z.object({
    shareId: z.string(),
    role: z.enum(roles.filter((v) => v !== "owner"))
})

const deleteShareSchema = z.object({
    shareId: z.string(),
})

export async function getShares(req: Request, res: Response) {
    try {
        const getSharesReq = getSharesSchema.parse({ ...req.params })
        const listShares = await dbGetListShares(getSharesReq.listId)
        if (!listShares.rowCount) {
            res.status(200).json({ message: "No shares found" })
            return
        }
        res.status(200).json(listShares.rows)
    } catch (err) {
        logger.error({ err, ...req.params }, "Error retrieving shares for list")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Error getting shares of list" })
    }
}

export async function addShare(req: Request, res: Response) {
    try {
        const addShareReq = addShareSchema.parse({ ...req.params, ...req.body })
        const newShare = await dbAddListShare(addShareReq.userEmail, addShareReq.listId, addShareReq.role)
        if (!newShare.rowCount) {
            res.status(404).json({ message: "No user found with that email" })
            return
        }
        res.status(200).json({ message: "Successfully added user to list" })
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
        res.status(500).json({ message: "Error sharing list" })
    }
}

export async function updateShare(req: Request, res: Response) {
    try {
        const updateShareReq = updateShareSchema.parse({ ...req.params, ...req.body })
        const updatedShare = await dbUpdateListSharePermission(updateShareReq.shareId, updateShareReq.role)
        if (!updatedShare.rowCount) {
            res.status(404).json({ message: "Failed to update share settings" })
            return
        }
        res.status(200).json({ message: `updated user's role to ${updateShareReq.role}` })
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
        res.status(500).json({ message: "Error updating user's list access" })
    }
}

export async function deleteShare(req: Request, res: Response) {
    try {
        const deleteShareReq = deleteShareSchema.parse({ ...req.params })
        const deletedShare = await dbDeleteListShare(deleteShareReq.shareId)
        if (!deletedShare.rowCount) {
            res.status(404).json({ message: "Failed to delete list share" })
            return
        }
        res.status(200).json({ message: "Removed user from list successfully" })
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
        res.status(500).json({ message: "Error removing user from list" })
    }
}