import { betterAuth } from "better-auth";
import pg from "pg";

export const auth = betterAuth({
  database: new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, disableSignUp: true },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 10 },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
});
