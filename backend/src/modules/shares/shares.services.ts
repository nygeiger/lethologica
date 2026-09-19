import { dbQuery } from "../../config/db.js"
import type { Role } from "../lists/types.js"
import type { Share } from "./types.js"

export const dbGetListShares = (listId: string) => {
    const queryParams = [listId]
    return dbQuery<Share>(
        `SELECT ls.*, u.email as shared_with_email
        FROM list_shares ls
        JOIN users u ON u.id = ls.shared_with_user_id
        WHERE ls.list_id = $1
        ORDER BY ls.created_at DESC`, queryParams
    )
}

export const dbAddListShare = (userEmail: string, listId: string, role: Role) => {
    const queryParams = [userEmail, listId, role]
    return dbQuery<Share>(
        `WITH target_user AS (
            SELECT id FROM users WHERE email = $1
        )
        INSERT INTO list_shares (list_id, shared_with_user_id, role)
        SELECT $2, id, $3 FROM target_user`, queryParams
    )
}

export const dbUpdateListSharePermission = (shareId: string, role: Role) => {
    const queryParams = [shareId, role]
    return dbQuery<Share>(
        `UPDATE list_shares SET role=$2 WHERE id=$1`, queryParams
    )
}

export const dbDeleteListShare = (shareId: string) => {
    const queryParams = [shareId]
    return dbQuery<Share>(
        `DELETE FROM list_shares WHERE id=$1`, queryParams
    )
}