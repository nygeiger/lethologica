import { dbQuery } from "../../config/db.js"

export const dbSearchUsers = (emailQuery: string, currentUserId: string, listId: string) => {
    const queryParams = [`%${emailQuery}%`, currentUserId, listId]
    return dbQuery<{ id: string, email: string }>(
        `SELECT id, email FROM users
        WHERE email ILIKE $1
        AND id != $2
        AND id NOT IN (
          SELECT shared_with_user_id FROM list_shares WHERE list_id = $3
        )
        LIMIT 10`, queryParams
    )
}

export default dbSearchUsers
