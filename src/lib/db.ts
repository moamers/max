import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __maxDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!globalThis.__maxDb) {
    globalThis.__maxDb = createDb();
  }
  return globalThis.__maxDb;
}
