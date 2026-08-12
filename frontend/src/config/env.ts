import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_SERVER_URL: z.string()
})

type ENV = {
  NODE_ENV: 'development' | 'production' | 'test',
  VITE_SERVER_URL: string
}

const env: ENV = envSchema.parse(import.meta.env)
export default env;