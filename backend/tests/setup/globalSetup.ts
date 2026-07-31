import { execSync } from 'child_process'
import { testEnv } from '../../src/config/env.js'
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import logger from '../../src/utils/logger.js'


const testPool = new Pool({
    connectionString: testEnv.TEST_DATABASE_URL
})

export const testDbQuery = async <T extends QueryResultRow>(text: string, params?: unknown[]) => {
    // logger.debug({ port: env.PORT, testPort: testEnv.PORT, dburl: env.DATABASE_URL }, `executing test db query: ${text}`)
    const res: QueryResult<T> = await testPool.query(text, params)
    return res
}

export async function setup() {
    process.env["DATABASE_URL"] = testEnv.TEST_DATABASE_URL
    process.env["NODE_ENV"] = testEnv.NODE_ENV
    process.env["JWT_SECRET"] = testEnv.JWT_SECRET
    process.env["JWT_EXPIRES_IN"] = testEnv.JWT_EXPIRES_IN
    process.env["PORT"] = testEnv.PORT

    // run migrations against test database
    execSync('pnpm db:migrate', { stdio: 'inherit' })

    const wordsExist = (await testDbQuery("SELECT EXISTS (SELECT 1 FROM words LIMIT 1)")).rows[0]
    if (!wordsExist || !wordsExist["exists"]) {
        logger.debug(wordsExist, "There are no words in the databaase")
        logger.debug("Seeding database")
        execSync('pnpm db:seed', { stdio: 'inherit' })
    }
}

export async function teardown() {
    await testDbQuery('TRUNCATE users, lists, user_word_progress, list_words, list_shares CASCADE')
    await testPool.end()
}
