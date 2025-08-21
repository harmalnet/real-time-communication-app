import { ZodError, z } from "zod";

export const envSchema = z.object({
  PORT: z.string().optional(),
  REDIS_URL: z.string().optional(),

  MYSQL_HOST: z.string(),
  MYSQL_PORT: z.string(),
  MYSQL_USER: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string(),

  JWT_SEC: z.string(),
  REFRESH_TOKEN: z.string(),
  NODE_ENV: z.string(),
});

try {
  envSchema.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    const missingEnvs = error.errors
      .map((e) => e.path)
      .reduce((acc, v) => acc.concat(v), [])
      .join("\n");

    console.error(`Missing or invalid environment variables: \n${missingEnvs}`);

    process.exit(1);
  }
}
