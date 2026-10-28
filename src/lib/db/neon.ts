import "server-only";
import { neon } from "@neondatabase/serverless";

export function getDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("Neon database connection is missing.");
  }

  return neon(url);
}
