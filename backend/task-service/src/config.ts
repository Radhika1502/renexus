import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3002),
  host: z.string().default('0.0.0.0'),
  corsOrigins: z.array(z.string()).default(['http://localhost:3000']),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    user: z.string().default('postgres'),
    password: z.string().default('postgres'),
    database: z.string().default('renexus'),
  }),
});

export const config = configSchema.parse({
  port: process.env.PORT,
  host: process.env.HOST,
  corsOrigins: process.env.CORS_ORIGINS?.split(','),
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
}); 