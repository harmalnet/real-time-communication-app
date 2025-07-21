import { ZodError, z } from "zod";

export const envSchema = z.object({
  PORT: z.string().optional(),
  REDIS_URL: z.string().optional(),
  MONGODB_URI: z.string(),
  BASE_URL: z.string(),
  GMAIL_USER: z.string(),
  GMAIL_PASS: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),


  PAYSTACK_SECRET: z.string(),
  SESSION_SECRET: z.string(),
  MOCK_PAYSTACK: z.string(),


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
