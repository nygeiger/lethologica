import type { Role } from "../lists/types.js"

export type Share = {
    id: string,
    list_id: string,
    shared_with_user_id: string,
    role: Role,
    created_at: string
}