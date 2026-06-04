import { Pool } from 'pg'
import env from './env.js'

const pool = new Pool({
  connectionString: env.DATABASE_URL
})

export const dbHealthCheck = async () => {
    try {
        const res = await pool.query('SELECT $1::text as message', ['Hello world!'])
        return res.rows[0].message
    } catch (err) {
        console.error(err);
        return "Error connecting to Database"
    }
}

export const query = async (text: string, params: any[]) => {
    try {
        const res = await pool.query(text, params)
        return res;
    } catch (err) {
        console.error(err);
        return "Database query error"
    }
}