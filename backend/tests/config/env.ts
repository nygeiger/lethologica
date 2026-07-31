import dotenv from 'dotenv'
import z from "zod"

dotenv.config()

const testEnvSchema = z.object({
    NODE_ENV: z.literal("test"),
    PORT: z.string(),
    TEST_DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string()
})

type TESTENV = {
    NODE_ENV: 'test',
    PORT: string
    TEST_DATABASE_URL: string,
    JWT_SECRET: string,
    JWT_EXPIRES_IN: string
}

const testEnv: TESTENV = testEnvSchema.parse({
    NODE_ENV: 'test',
    PORT: "3001",
    TEST_DATABASE_URL: process.env["TEST_DATABASE_URL"],
    JWT_SECRET: "test_secret",
    JWT_EXPIRES_IN: "1d"
})
export default testEnv