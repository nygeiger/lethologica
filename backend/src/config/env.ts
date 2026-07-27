import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string()
})

const testEnvSchema = z.object({
    NODE_ENV: z.literal("test"),
    PORT: z.string(),
    TEST_DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string()
})

type ENV = {
    NODE_ENV: 'development' | 'production' | 'test',
    PORT: number
    DATABASE_URL: string,
    JWT_SECRET: string,
    JWT_EXPIRES_IN: string
}

type TESTENV = {
    NODE_ENV: 'test',
    PORT: string
    TEST_DATABASE_URL: string,
    JWT_SECRET: string,
    JWT_EXPIRES_IN: string
}

export const testEnv: TESTENV = testEnvSchema.parse({
    NODE_ENV: 'test',
    PORT: "3001",
    TEST_DATABASE_URL: process.env["TEST_DATABASE_URL"],
    JWT_SECRET: "test_secret",
    JWT_EXPIRES_IN: "1d"
})

const env: ENV = envSchema.parse(process.env)
export default env;