import type { NextFunction, Request, Response } from "express";
import { dbQuery } from "../../config/db.js";
import z from "zod";

const permReqSchema = z.object({
    userId: z.string(),
    listId: z.string()
})

type Permission = "canShare" | "canEdit" | "canView" | "isOwner"

export const rolePermissions = new Map<string, Permission[]>(
    [
        ["owner", ["canShare", "canEdit", "canView", "isOwner"]],
        ["editor", ["canEdit", "canView"]],
        ["viewer", ["canView"]]
    ]
)

//* middleware chain: authenticateJWT
export function requirePermission(requiredPerm: Permission) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const reqVals = permReqSchema.parse({ userId: req.user!.userId, listId: req.params["listId"] })
            const owingUser = (await dbQuery<{ owner_id: string }>("SELECT owner_id FROM lists WHERE id=$1", [reqVals.listId]))
            if (owingUser.rows[0]?.owner_id === reqVals.userId) {
                return next()
            }
            const listRoleResult = (await dbQuery<{ role: string }>("SELECT role FROM list_shares WHERE shared_with_user_id=$1 AND list_id=$2", [reqVals.userId, reqVals.listId]))
            if (listRoleResult.rows[0] && rolePermissions.get(listRoleResult.rows[0].role)?.includes(requiredPerm)) {
                return next()
            }
            res.status(403).json({ message: "Insufficient permissions for action" })
        } catch (err) {
            res.status(500).json({ message: "Error retrieving list permission" })
        }
    }
}