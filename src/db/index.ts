import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

// Lazy initialisation so build-time doesn't require DATABASE_URL.
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    _client = postgres(connectionString, { max: 10, prepare: false });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

export function getClient() {
  if (!_client) getDb();
  return _client!;
}

export { schema };
