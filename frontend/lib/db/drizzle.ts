import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const isMock = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('***');

export const client = isMock ? null as any : postgres(process.env.POSTGRES_URL!);
export const db = isMock ? null as any : drizzle(client, { schema });
