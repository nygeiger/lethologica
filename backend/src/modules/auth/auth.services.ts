import { dbQuery } from "../../config/db.js"

type User = {
    id: string
    email: string
    password_hash: string
    created_at: string | null
}

export const dbGetUser = (email: string) => {
    const queryParams = [email]
    return dbQuery<User>(`SELECT id, email, password_hash FROM users WHERE email=$1`, queryParams)
}

export const dbInsertUser = (email: string, pass: string) => {
    const queryParams = [email, pass]
    return dbQuery<User>(`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, password_hash`, queryParams)
}

export const dbGetAuthedUser = (id: string) => {
    const queryParams = [id]
    return dbQuery<User>(`SELECT id, email, created_at FROM users WHERE id=$1`, queryParams)
}