import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number().default(4002),
  DATABASE_URL: z.string(),
//   JWT_SECRET: z.string(),
})

type ENV = {
    NODE_ENV: 'development' | 'production' | 'test',
    PORT: number
    DATABASE_URL: string,
    // JWT_SECRET: string
}

const env: ENV = envSchema.parse(process.env);
export default env;