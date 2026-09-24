import type { NextFunction, Request, Response } from "express";
import { dbQuery } from "../../config/db.js";
import z from "zod";
import { type Permission, rolePermissions, type Role } from "./types.js";
import logger from "../../utils/logger.js";

const permReqSchema = z.object({
    userId: z.string(),
    listId: z.string()
})

/**
 * Creates a list-access middleware factory for a required permission level.
 *
 * This uses the factory pattern: the route calls `requirePermission("canEdit")`, which returns
 * a middleware function bound to that specific permission. The returned middleware then checks
 * the current request user and list against the store's ownership and share rules.
 *
 * Valid permission levels are defined by the shared `Permission` union and the role map:
 * - `canView` - read access
 * - `canEdit` - add/remove/update list content
 * - `canShare` - manage sharing settings
 * - `isOwner` - list ownership checks
 *
 * The middleware expects an authenticated user to already be attached to `req.user.userId` by
 * the auth middleware. It does not add a custom permission flag to `req`; it simply reads the
 * authenticated user and list id and either calls `next()` or responds with an error.
 *
 * @param requiredPerm The permission that must be granted for the route to proceed.
 * @returns An Express middleware function that authorizes or rejects the request.
 *
 * @remarks If the user is the list owner, access is immediately granted. Otherwise the code
 * checks the `list_shares` table for a matching user/list role and verifies that the role has
 * `requiredPerm` in `rolePermissions`. If neither condition passes, the middleware returns
 * `403` with `{ message: "Insufficient permissions for action" }`.
 */
export function requirePermission(requiredPerm: Permission) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const reqVals = permReqSchema.parse({ userId: req.user!.userId, listId: req.params["listId"] })
            const owingUser = (await dbQuery<{ owner_id: string }>("SELECT owner_id FROM lists WHERE id=$1", [reqVals.listId]))
            if (owingUser.rows[0]?.owner_id === reqVals.userId) {
                return next()
            }
            const listRoleResult = (await dbQuery<{ role: string }>("SELECT role FROM list_shares WHERE shared_with_user_id=$1 AND list_id=$2", [reqVals.userId, reqVals.listId]))
            if (listRoleResult.rows[0] && rolePermissions.get(listRoleResult.rows[0].role as Role)?.includes(requiredPerm)) {
                return next()
            }
            res.status(403).json({ message: "Insufficient permissions for action" })
        } catch (err) {
            logger.error({err, ...req.user}, "Error resolving user's list permissions")
            res.status(500).json({ message: "Error retrieving list permission" })
        }
    }
}