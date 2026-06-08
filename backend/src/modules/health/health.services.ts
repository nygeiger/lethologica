import { dbQuery } from "../../config/db.js"

export const dbHealthCheck = async (): Promise<string> => {
    const res = await dbQuery<{ message: string }>('SELECT $1::text as message', ['Hello world!'])
    return res.rows[0]?.message ?? ""
}