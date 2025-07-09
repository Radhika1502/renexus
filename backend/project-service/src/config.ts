import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3001),
  host: z.string().default('0.0.0.0'),
  corsOrigins: z.string().transform(str => str.split(',')).default('http://localhost:3000'),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
});

export type Config = z.infer<typeof configSchema>;

// Load and validate environment variables
export const config = configSchema.parse({
  port: process.env.PORT,
  host: process.env.HOST,
  corsOrigins: process.env.CORS_ORIGINS,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
}); 