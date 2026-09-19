import type { Request, Response } from "express";
import z from "zod";
import { dbSearchUsers } from "./users.services.js";
import logger from "../../utils/logger.js";

const searchUsersSchema = z.object({
    email: z.string(),
    listId: z.string(),
})

export async function searchUsers(req: Request, res: Response) {
    try {
        const query = searchUsersSchema.parse({ ...req.query })
        const currentUserId = req.user?.userId
        if (!currentUserId) {
            res.status(401).json({ message: "User not authenticated" })
            return
        }

        const users = await dbSearchUsers(query.email, currentUserId, query.listId)
        if (!users.rowCount) {
            res.status(200).json([])
            return
        }

        res.status(200).json(users.rows)
    } catch (err) {
        logger.error({ err, query: req.query }, "Error searching users")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Error searching users" })
    }
}