import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

interface DbData {
  users: any[];
  downloadLogs: any[];
  activityLogs: any[];
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
            paddleCustomerId: null,
            paddleSubscriptionId: null,
            paddlePriceId: null,
            planName: 'Free',
            subscriptionStatus: 'active',
          }
        ],
        downloadLogs: [],
        activityLogs: [],
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
    data.downloadLogs = data.downloadLogs.map((l: any) => ({
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
    }));
    data.activityLogs = data.activityLogs.map((l: any) => ({
      ...l,
      timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
    }));

    return data;
  } catch (error) {
    console.error('Error reading JSON DB:', error);
    return {
      users: [],
      downloadLogs: [],
      activityLogs: [],
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
  getDownloadLogs: () => readDb().downloadLogs,
  getActivityLogs: () => readDb().activityLogs,

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
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      paddlePriceId: null,
      planName: 'Free',
      subscriptionStatus: 'active',
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
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
      userId: log.userId,
      action: log.action,
      timestamp: new Date(),
      ipAddress: log.ipAddress || '',
    };
    data.activityLogs.push(newLog);
    writeDb(data);
    return newLog;
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
};
