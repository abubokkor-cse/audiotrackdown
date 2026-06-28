import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

interface DbData {
  users: any[];
  teams: any[];
  teamMembers: any[];
  downloadLogs: any[];
  activityLogs: any[];
  invitations: any[];
}

// Pre-seeded bcrypt hash for "password123"
const SEED_PASSWORD_HASH = '$2a$10$tZg/r5K/8lV1r1zD7/242eQ8u.zDk96dJ/GjF741tD146sR7Bv22.';

function readDb(): DbData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData: DbData = {
        users: [
          {
            id: 1,
            name: 'Demo User',
            email: 'user@example.com',
            passwordHash: SEED_PASSWORD_HASH,
            role: 'owner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          }
        ],
        teams: [
          {
            id: 1,
            name: "Demo's Team",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paddleCustomerId: null,
            paddleSubscriptionId: null,
            paddlePriceId: null,
            planName: 'Free',
            subscriptionStatus: 'active',
          }
        ],
        teamMembers: [
          {
            id: 1,
            userId: 1,
            teamId: 1,
            role: 'owner',
            joinedAt: new Date().toISOString(),
          }
        ],
        downloadLogs: [],
        activityLogs: [],
        invitations: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(content);

    // Convert date strings to Date objects for compatibility with Drizzle types
    data.users = data.users.map((u: any) => ({
      ...u,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
    }));
    data.teams = data.teams.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    }));
    data.teamMembers = data.teamMembers.map((m: any) => ({
      ...m,
      joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
    }));
    data.downloadLogs = data.downloadLogs.map((l: any) => ({
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
    }));
    data.activityLogs = data.activityLogs.map((l: any) => ({
      ...l,
      timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
    }));
    data.invitations = data.invitations.map((i: any) => ({
      ...i,
      invitedAt: i.invitedAt ? new Date(i.invitedAt) : new Date(),
    }));

    return data;
  } catch (error) {
    console.error('Error reading JSON DB:', error);
    return {
      users: [],
      teams: [],
      teamMembers: [],
      downloadLogs: [],
      activityLogs: [],
      invitations: [],
    };
  }
}

function writeDb(data: DbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing JSON DB:', error);
  }
}

export const jsonDb = {
  getUsers: () => readDb().users,
  getTeams: () => readDb().teams,
  getTeamMembers: () => readDb().teamMembers,
  getDownloadLogs: () => readDb().downloadLogs,
  getActivityLogs: () => readDb().activityLogs,
  getInvitations: () => readDb().invitations,

  insertUser: (user: any) => {
    const data = readDb();
    const id = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id,
      name: user.name || null,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role || 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  insertTeam: (team: any) => {
    const data = readDb();
    const id = data.teams.length > 0 ? Math.max(...data.teams.map(t => t.id)) + 1 : 1;
    const newTeam = {
      id,
      name: team.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      paddlePriceId: null,
      planName: 'Free',
      subscriptionStatus: 'active',
    };
    data.teams.push(newTeam);
    writeDb(data);
    return newTeam;
  },

  insertTeamMember: (member: any) => {
    const data = readDb();
    const id = data.teamMembers.length > 0 ? Math.max(...data.teamMembers.map(m => m.id)) + 1 : 1;
    const newMember = {
      id,
      userId: member.userId,
      teamId: member.teamId,
      role: member.role || 'member',
      joinedAt: new Date(),
    };
    data.teamMembers.push(newMember);
    writeDb(data);
    return newMember;
  },

  insertDownloadLog: (log: any) => {
    const data = readDb();
    const id = data.downloadLogs.length > 0 ? Math.max(...data.downloadLogs.map(l => l.id)) + 1 : 1;
    const newLog = {
      id,
      userId: log.userId || null,
      ipAddress: log.ipAddress,
      createdAt: new Date(),
      type: log.type || null,
      lang: log.lang || null,
    };
    data.downloadLogs.push(newLog);
    writeDb(data);
    return newLog;
  },

  insertActivityLog: (log: any) => {
    const data = readDb();
    const id = data.activityLogs.length > 0 ? Math.max(...data.activityLogs.map(l => l.id)) + 1 : 1;
    const newLog = {
      id,
      teamId: log.teamId,
      userId: log.userId,
      action: log.action,
      timestamp: new Date(),
      ipAddress: log.ipAddress || '',
    };
    data.activityLogs.push(newLog);
    writeDb(data);
    return newLog;
  },

  updateTeam: (id: number, updates: any) => {
    const data = readDb();
    const teamIndex = data.teams.findIndex(t => t.id === id);
    if (teamIndex !== -1) {
      data.teams[teamIndex] = {
        ...data.teams[teamIndex],
        ...updates,
        updatedAt: new Date(),
      };
      writeDb(data);
      return data.teams[teamIndex];
    }
    return null;
  },

  updateUser: (id: number, updates: any) => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      data.users[userIndex] = {
        ...data.users[userIndex],
        ...updates,
        updatedAt: new Date(),
      };
      writeDb(data);
      return data.users[userIndex];
    }
    return null;
  },

  deleteTeamMember: (memberId: number, teamId: number) => {
    const data = readDb();
    const originalLength = data.teamMembers.length;
    data.teamMembers = data.teamMembers.filter(m => !(m.id === memberId && m.teamId === teamId));
    if (data.teamMembers.length !== originalLength) {
      writeDb(data);
      return true;
    }
    return false;
  },
};
