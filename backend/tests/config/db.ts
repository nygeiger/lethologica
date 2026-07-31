import { Pool, type QueryResult, type QueryResultRow } from "pg"
import testEnv from "./env.js"

export const testPool = new Pool({
    connectionString: testEnv.TEST_DATABASE_URL
})

export const testDbQuery = async <T extends QueryResultRow>(text: string, params?: unknown[]) => {
    // logger.debug({ port: env.PORT, testPort: testEnv.PORT, dburl: env.DATABASE_URL }, `executing test db query: ${text}`)
    const res: QueryResult<T> = await testPool.query(text, params)
    return res
}