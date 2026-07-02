'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  activityLogs,
  type NewUser,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { jsonDb } from '@/lib/db/jsonDb';

const isMock = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('***');

async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (isMock) {
    jsonDb.insertActivityLog({
      userId,
      action: type,
      ipAddress: ipAddress || ''
    });
    return;
  }
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  if (isMock) {
    const foundUser = jsonDb.getUsers().find((u: any) => u.email === email && !u.deletedAt);
    if (!foundUser) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    const isPasswordValid = await comparePasswords(password, foundUser.passwordHash);
    if (!isPasswordValid) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    await Promise.all([
      setSession(foundUser),
      logActivity(foundUser.id, ActivityType.SIGN_IN)
    ]);

    const redirectTo = formData.get('redirect') as string | null;
    if (redirectTo === 'checkout' || redirectTo === 'pricing') {
      redirect('/pricing');
    }

    redirect('/dashboard');
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  const foundUser = userResult[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout' || redirectTo === 'pricing') {
    redirect('/pricing');
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password } = data;

  if (isMock) {
    const existingUser = jsonDb.getUsers().find((u: any) => u.email === email);
    if (existingUser) {
      return {
        error: 'Failed to create user. Please try again.',
        email,
        password
      };
    }

    const passwordHash = await hashPassword(password);
    const createdUser = jsonDb.insertUser({
      email,
      passwordHash,
      role: 'owner'
    });

    await Promise.all([
      logActivity(createdUser.id, ActivityType.SIGN_UP),
      setSession(createdUser)
    ]);

    const redirectTo = formData.get('redirect') as string | null;
    if (redirectTo === 'checkout' || redirectTo === 'pricing') {
      redirect('/pricing');
    }

    redirect('/dashboard');
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner'
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  await Promise.all([
    logActivity(createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout' || redirectTo === 'pricing') {
    redirect('/pricing');
  }

  redirect('/dashboard');
});

export async function signOut() {
  const user = (await getUser()) as User;
  if (user) {
    await logActivity(user.id, ActivityType.SIGN_OUT);
  }
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    if (isMock) {
      jsonDb.updateUser(user.id, { passwordHash: newPasswordHash });
      await logActivity(user.id, ActivityType.UPDATE_PASSWORD);
      return {
        success: 'Password updated successfully.'
      };
    }

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    if (isMock) {
      await logActivity(
        user.id,
        ActivityType.DELETE_ACCOUNT
      );
      jsonDb.updateUser(user.id, {
        deletedAt: new Date().toISOString(),
        email: `${user.email}-${user.id}-deleted`
      });
      (await cookies()).delete('session');
      redirect('/sign-in');
    }

    await logActivity(
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    if (isMock) {
      jsonDb.updateUser(user.id, { name, email });
      await logActivity(user.id, ActivityType.UPDATE_ACCOUNT);
      return { name, success: 'Account updated successfully.' };
    }

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);
