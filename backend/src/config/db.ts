import { Pool, type QueryResult } from 'pg'
import env from './env.js'

const pool = new Pool({
    connectionString: env.DATABASE_URL
})

export const dbHealthCheck = async (): Promise<string> => {
    const res: QueryResult<{message: string}> = await pool.query('SELECT $1::text as message', ['Hello world!'])
    return res.rows[0]?.message ?? ""
}

export const dbQuery = async (text: string, params?: unknown[]) => {
    const res = await pool.query(text, params)
    return res
}