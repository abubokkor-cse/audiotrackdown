import { desc, and, or, eq, isNull, gte, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, downloadLogs } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { jsonDb } from './jsonDb';

const isMock = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('***');

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  if (isMock) {
    const list = jsonDb.getUsers();
    const user = list.find((u: any) => u.id === sessionData.user.id && !u.deletedAt);
    return user || null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByPaddleCustomerId(customerId: string) {
  if (isMock) {
    const list = jsonDb.getTeams();
    const team = list.find((t: any) => t.paddleCustomerId === customerId);
    return team || null;
  }

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.paddleCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    paddleSubscriptionId: string | null;
    paddlePriceId: string | null;
    planName: string | null;
    subscriptionStatus: string | null;
  }
) {
  if (isMock) {
    jsonDb.updateTeam(teamId, subscriptionData);
    return;
  }

  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getDailyDownloadCount(userId: number | null, ipAddress: string): Promise<number> {
  if (isMock) {
    const logs = jsonDb.getDownloadLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = logs.filter((l: any) => {
      const logDate = new Date(l.createdAt);
      if (logDate < today) return false;
      if (userId) {
        return l.userId === userId || l.ipAddress === ipAddress;
      }
      return l.ipAddress === ipAddress;
    }).length;
    return count;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let condition;
  if (userId) {
    condition = and(
      gte(downloadLogs.createdAt, today),
      or(eq(downloadLogs.userId, userId), eq(downloadLogs.ipAddress, ipAddress))
    );
  } else {
    condition = and(
      gte(downloadLogs.createdAt, today),
      eq(downloadLogs.ipAddress, ipAddress)
    );
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(downloadLogs)
    .where(condition);

  return Number(result[0]?.count || 0);
}

export async function logDownload(
  userId: number | null, 
  ipAddress: string, 
  type?: 'audio' | 'subtitle', 
  lang?: string
): Promise<void> {
  if (isMock) {
    jsonDb.insertDownloadLog({ userId, ipAddress, type, lang });
    return;
  }

  await db.insert(downloadLogs).values({
    userId,
    ipAddress,
    type,
    lang,
  });
}

export async function getDashboardStats(userId: number | null, ipAddress: string) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  let logs: any[] = [];

  if (isMock) {
    logs = jsonDb.getDownloadLogs();
    logs = logs.filter((l: any) => {
      if (userId) {
        return l.userId === userId || l.ipAddress === ipAddress;
      }
      return l.ipAddress === ipAddress;
    });
  } else {
    let condition;
    if (userId) {
      condition = or(eq(downloadLogs.userId, userId), eq(downloadLogs.ipAddress, ipAddress));
    } else {
      condition = eq(downloadLogs.ipAddress, ipAddress);
    }
    logs = await db.select().from(downloadLogs).where(condition);
  }

  const thisMonthLogs = logs.filter(l => new Date(l.createdAt) >= startOfThisMonth);
  const lastMonthLogs = logs.filter(l => {
    const d = new Date(l.createdAt);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  });

  const downloadsThisMonth = thisMonthLogs.length;
  const downloadsLastMonth = lastMonthLogs.length;
  const diff = downloadsThisMonth - downloadsLastMonth;
  const hintDownloads = diff >= 0 ? `↑ ${diff} from last month` : `↓ ${Math.abs(diff)} from last month`;

  const audioCount = thisMonthLogs.filter(l => l.type === 'audio').length;
  const subtitleCount = thisMonthLogs.filter(l => l.type === 'subtitle').length;

  const uniqueLanguages = new Set(
    thisMonthLogs
      .map(l => l.lang)
      .filter(Boolean)
  );
  const languagesCount = uniqueLanguages.size;

  return {
    downloadsThisMonth,
    hintDownloads,
    audioCount,
    subtitleCount,
    languagesCount,
  };
}

export async function getUserWithTeam(userId: number) {
  if (isMock) {
    const user = jsonDb.getUsers().find((u: any) => u.id === userId);
    const member = jsonDb.getTeamMembers().find((m: any) => m.userId === userId);
    return { user, teamId: member ? member.teamId : null };
  }

  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  if (isMock) {
    const logs = jsonDb.getActivityLogs().filter((l: any) => l.userId === user.id);
    const usersList = jsonDb.getUsers();
    return logs.map((l: any) => {
      const u = usersList.find((x: any) => x.id === l.userId);
      return {
        id: l.id,
        action: l.action,
        timestamp: new Date(l.timestamp),
        ipAddress: l.ipAddress,
        userName: u ? u.name : 'Unknown',
      };
    }).slice(0, 10);
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  if (isMock) {
    const member = jsonDb.getTeamMembers().find((m: any) => m.userId === user.id);
    if (!member) return null;
    const team = jsonDb.getTeams().find((t: any) => t.id === member.teamId);
    if (!team) return null;
    const members = jsonDb.getTeamMembers()
      .filter((m: any) => m.teamId === team.id)
      .map((m: any) => {
        const u = jsonDb.getUsers().find((x: any) => x.id === m.userId);
        return {
          ...m,
          joinedAt: new Date(m.joinedAt),
          user: {
            id: u?.id,
            name: u?.name,
            email: u?.email,
          }
        };
      });
    return {
      ...team,
      createdAt: new Date(team.createdAt),
      updatedAt: new Date(team.updatedAt),
      teamMembers: members,
    };
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}
