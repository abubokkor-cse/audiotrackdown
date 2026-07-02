import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  // Clean existing data first
  await db.delete(users);

  const email = process.env.SEED_EMAIL || 'admin@example.com';
  const password = process.env.SEED_PASSWORD || 'secure-password-placeholder';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
