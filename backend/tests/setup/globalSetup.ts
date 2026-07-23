import { execSync } from 'child_process'
import dotenv from 'dotenv'
import { Pool, type QueryResult, type QueryResultRow } from 'pg'

dotenv.config()

const testPool = new Pool({
    connectionString: process.env["TEST_DATABASE_URL"]
})

export const testdbQuery = async <T extends QueryResultRow>(text: string, params?: unknown[]) => {
    const res: QueryResult<T> = await testPool.query(text, params)
    return res
}

export async function setup() {
    process.env["DATABASE_URL"] = process.env["TEST_DATABASE_URL"]
    process.env["NODE_ENV"] = "test"
    process.env["JWT_SECRET"] = "test_secret"
    process.env["JWT_EXPIRES_IN"] = "1d"
    process.env["PORT"] = "3001"

    // run migrations against test database
    execSync('pnpm db:migrate', { stdio: 'inherit' })
}
export async function teardown() {
    await testdbQuery('TRUNCATE users, lists, user_word_progress, list_words, list_shares CASCADE')
    await testPool.end()
}