const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS Reading (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    deviceId TEXT,
    soilMoisturePct REAL,
    soilTempC REAL,
    airTempC REAL,
    humidityPct REAL,
    ph REAL,
    ecDsM REAL,
    nitrogen REAL,
    phosphorus REAL,
    potassium REAL
  );
  
  CREATE TABLE IF NOT EXISTS Alert (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    deviceId TEXT,
    type TEXT,
    severity TEXT,
    message TEXT,
    acknowledged BOOLEAN DEFAULT 0,
    lastSentAt DATETIME
  );
  
  CREATE TABLE IF NOT EXISTS Recipient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    isEnabled BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const prisma = {
    reading: {
        findMany: (args) => {
            let q = 'SELECT * FROM Reading';
            if (args?.orderBy?.ts) q += ` ORDER BY ts ${args.orderBy.ts}`;
            return db.prepare(q).all().map(r => ({ ...r, ts: new Date(r.ts) }));
        },
        findFirst: (args) => {
            let q = 'SELECT * FROM Reading';
            if (args?.orderBy?.ts) q += ` ORDER BY ts ${args.orderBy.ts}`;
            q += ' LIMIT 1';
            const r = db.prepare(q).get();
            return r ? { ...r, ts: new Date(r.ts) } : null;
        },
        create: ({ data }) => {
            const stmt = db.prepare(`
        INSERT INTO Reading (deviceId, soilMoisturePct, soilTempC, airTempC, humidityPct, ph, ecDsM, nitrogen, phosphorus, potassium, ts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const info = stmt.run(
                data.deviceId,
                data.soilMoisturePct,
                data.soilTempC,
                data.airTempC,
                data.humidityPct,
                data.ph,
                data.ecDsM,
                data.nitrogen || 0,
                data.phosphorus || 0,
                data.potassium || 0,
                data.ts ? data.ts.toISOString() : new Date().toISOString()
            );
            return { id: info.lastInsertRowid, ...data };
        }
    },
    alert: {
        findMany: (args) => {
            let q = 'SELECT * FROM Alert';
            if (args?.orderBy?.ts) q += ` ORDER BY ts ${args.orderBy.ts}`;
            return db.prepare(q).all().map(r => ({ ...r, ts: new Date(r.ts), acknowledged: !!r.acknowledged }));
        },
        create: ({ data }) => {
            const stmt = db.prepare(`
        INSERT INTO Alert (deviceId, type, severity, message, acknowledged, lastSentAt, ts)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            const info = stmt.run(
                data.deviceId, data.type, data.severity, data.message,
                data.acknowledged ? 1 : 0,
                data.lastSentAt ? data.lastSentAt.toISOString() : null,
                data.ts ? data.ts.toISOString() : new Date().toISOString()
            );
            return { id: info.lastInsertRowid, ...data };
        },
        update: ({ where, data }) => {
            if (data.acknowledged !== undefined) {
                db.prepare('UPDATE Alert SET acknowledged = ? WHERE id = ?').run(data.acknowledged ? 1 : 0, where.id);
            }
            return { id: where.id, ...data };
        }
    },
    recipient: {
        count: () => {
            return db.prepare('SELECT count(*) as count FROM Recipient').get().count;
        },
        findMany: () => {
            return db.prepare('SELECT * FROM Recipient WHERE isEnabled = 1').all();
        },
        create: ({ data }) => {
            const stmt = db.prepare('INSERT INTO Recipient (email, isEnabled) VALUES (?, ?)');
            stmt.run(data.email, data.isEnabled ? 1 : 0);
            return data;
        }
    },
    user: {
        findUnique: ({ where }) => {
            if (where.email) {
                return db.prepare('SELECT * FROM User WHERE email = ?').get(where.email) || null;
            }
            if (where.id) {
                return db.prepare('SELECT * FROM User WHERE id = ?').get(where.id) || null;
            }
            return null;
        },
        findMany: () => {
            return db.prepare('SELECT * FROM User').all();
        },
        create: ({ data }) => {
            const stmt = db.prepare('INSERT INTO User (name, email, password) VALUES (?, ?, ?)');
            const info = stmt.run(data.name, data.email, data.password);
            return { id: info.lastInsertRowid, ...data, createdAt: new Date() };
        }
    }
};

module.exports = { PrismaClient: function () { return prisma; } };
