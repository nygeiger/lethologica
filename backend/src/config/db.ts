import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import env from './env.js'

const pool = new Pool({
    connectionString: env.DATABASE_URL
})

export const dbQuery = async <T extends QueryResultRow>(text: string, params?: unknown[]) => {
    const res: QueryResult<T> = await pool.query(text, params)
    return res
}