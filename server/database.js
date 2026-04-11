// server/database.js
// SQLite persistence via better-sqlite3 (ESM-compatible using createRequire)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'bloodlink.db');

let db;

export function getDB() {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
}

export function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');   // Better concurrent reads
  db.pragma('foreign_keys = ON');
  createTables();
  console.log('📦 SQLite database ready:', DB_PATH);
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ngos (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT,
      phone         TEXT NOT NULL,
      city          TEXT,
      pincode       TEXT NOT NULL,
      address       TEXT,
      reg_number    TEXT,
      contact_person TEXT,
      lat           REAL,
      lng           REAL,
      password_hash TEXT NOT NULL,
      verified      INTEGER DEFAULT 1,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blood_inventory (
      id            TEXT PRIMARY KEY,
      ngo_id        TEXT NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
      blood_group   TEXT NOT NULL,
      units         INTEGER DEFAULT 0,
      updated_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(ngo_id, blood_group)
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL UNIQUE,
      email         TEXT,
      blood_group   TEXT NOT NULL,
      pincode       TEXT NOT NULL,
      lat           REAL,
      lng           REAL,
      address       TEXT,
      ngo_id        TEXT REFERENCES ngos(id),
      availability  TEXT DEFAULT 'anytime',
      is_available  INTEGER DEFAULT 1,
      otp           TEXT,
      otp_expires   TEXT,
      joined_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_requests (
      id              TEXT PRIMARY KEY,
      patient_name    TEXT NOT NULL,
      phone           TEXT,
      email           TEXT,
      age             TEXT,
      gender          TEXT,
      blood_group     TEXT NOT NULL,
      hospital        TEXT,
      city            TEXT,
      pincode         TEXT,
      lat             REAL,
      lng             REAL,
      units_needed    INTEGER DEFAULT 1,
      urgency         TEXT,
      emergency_level TEXT DEFAULT 'urgent',
      doctor_name     TEXT,
      prescription_id TEXT,
      notes           TEXT,
      dispatch_mode   TEXT DEFAULT 'manual',
      status          TEXT DEFAULT 'pending',
      matched_donor_id TEXT REFERENCES volunteers(id),
      matched_ngo_id   TEXT REFERENCES ngos(id),
      created_at       TEXT DEFAULT (datetime('now')),
      expires_at       TEXT DEFAULT (datetime('now', '+30 minutes'))
    );

    CREATE TABLE IF NOT EXISTS dispatch_events (
      id          TEXT PRIMARY KEY,
      request_id  TEXT REFERENCES patient_requests(id),
      donor_id    TEXT,
      event_type  TEXT,
      score       INTEGER,
      distance_km REAL,
      occurred_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed blood_inventory rows for all blood groups for each existing NGO
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const seedInventory = db.prepare(`
    INSERT OR IGNORE INTO blood_inventory (id, ngo_id, blood_group, units)
    VALUES (?, ?, ?, 0)
  `);
  const ngos = db.prepare('SELECT id FROM ngos').all();
  const seedAll = db.transaction((ngoId) => {
    BLOOD_GROUPS.forEach(bg => {
      seedInventory.run(`${ngoId}-${bg}`, ngoId, bg);
    });
  });
  ngos.forEach(n => seedAll(n.id));
}

// ─── NGO helpers ─────────────────────────────────────────────
export const db_ngos = {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO ngos (id, name, email, phone, city, pincode, address, reg_number, contact_person, lat, lng, password_hash)
      VALUES (@id, @name, @email, @phone, @city, @pincode, @address, @reg_number, @contact_person, @lat, @lng, @password_hash)
    `);
    stmt.run(data);
    // Seed inventory rows
    const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const seedInventory = db.prepare(`INSERT OR IGNORE INTO blood_inventory (id, ngo_id, blood_group, units) VALUES (?, ?, ?, 0)`);
    const seed = db.transaction(() => BLOOD_GROUPS.forEach(bg => seedInventory.run(`${data.id}-${bg}`, data.id, bg)));
    seed();
    return this.findById(data.id);
  },

  findById(id) {
    const ngo = db.prepare('SELECT * FROM ngos WHERE id = ?').get(id);
    if (!ngo) return null;
    ngo.inventory = this.getInventory(id);
    return ngo;
  },

  findByName(name) {
    return db.prepare('SELECT * FROM ngos WHERE lower(name) = lower(?)').get(name);
  },

  findAll() {
    const ngos = db.prepare('SELECT * FROM ngos ORDER BY created_at DESC').all();
    return ngos.map(n => ({ ...n, inventory: this.getInventory(n.id) }));
  },

  getInventory(ngoId) {
    const rows = db.prepare('SELECT blood_group, units FROM blood_inventory WHERE ngo_id = ?').all(ngoId);
    return Object.fromEntries(rows.map(r => [r.blood_group, r.units]));
  },

  updateInventory(ngoId, inventory) {
    const update = db.prepare(`
      INSERT INTO blood_inventory (id, ngo_id, blood_group, units)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(ngo_id, blood_group) DO UPDATE SET units = excluded.units, updated_at = datetime('now')
    `);
    const updateAll = db.transaction(() => {
      Object.entries(inventory).forEach(([bg, units]) => {
        update.run(`${ngoId}-${bg}`, ngoId, bg, Math.max(0, units));
      });
    });
    updateAll();
  },

  adjustInventory(ngoId, bloodGroup, delta) {
    db.prepare(`
      UPDATE blood_inventory SET units = MAX(0, units + ?), updated_at = datetime('now')
      WHERE ngo_id = ? AND blood_group = ?
    `).run(delta, ngoId, bloodGroup);
  },
};

// ─── Volunteer helpers ────────────────────────────────────────
export const db_volunteers = {
  create(data) {
    db.prepare(`
      INSERT INTO volunteers (id, name, phone, email, blood_group, pincode, lat, lng, address, ngo_id, availability)
      VALUES (@id, @name, @phone, @email, @blood_group, @pincode, @lat, @lng, @address, @ngo_id, @availability)
    `).run(data);
    // Auto-increment NGO inventory
    if (data.ngo_id && data.blood_group) {
      db_ngos.adjustInventory(data.ngo_id, data.blood_group, 1);
    }
    return this.findById(data.id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id);
  },

  findByPhone(phone) {
    return db.prepare('SELECT * FROM volunteers WHERE phone = ?').get(phone);
  },

  findAll(ngoId = null) {
    if (ngoId) return db.prepare('SELECT * FROM volunteers WHERE ngo_id = ?').all(ngoId);
    return db.prepare('SELECT * FROM volunteers ORDER BY joined_at DESC').all();
  },

  setOTP(id, otp, expiresMinutes = 10) {
    const expires = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();
    db.prepare('UPDATE volunteers SET otp = ?, otp_expires = ? WHERE id = ?').run(otp, expires, id);
  },

  clearOTP(id) {
    db.prepare('UPDATE volunteers SET otp = NULL, otp_expires = NULL WHERE id = ?').run(id);
  },

  toggleAvailability(id, available) {
    const vol = this.findById(id);
    if (!vol) return null;
    db.prepare('UPDATE volunteers SET is_available = ? WHERE id = ?').run(available ? 1 : 0, id);
    if (vol.ngo_id && vol.blood_group) {
      db_ngos.adjustInventory(vol.ngo_id, vol.blood_group, available ? 1 : -1);
    }
    return this.findById(id);
  },
};

// ─── Patient Request helpers ──────────────────────────────────
export const db_requests = {
  create(data) {
    db.prepare(`
      INSERT INTO patient_requests (id, patient_name, phone, email, age, gender, blood_group,
        hospital, city, pincode, lat, lng, units_needed, urgency, emergency_level,
        doctor_name, prescription_id, notes, dispatch_mode)
      VALUES (@id, @patient_name, @phone, @email, @age, @gender, @blood_group,
        @hospital, @city, @pincode, @lat, @lng, @units_needed, @urgency, @emergency_level,
        @doctor_name, @prescription_id, @notes, @dispatch_mode)
    `).run(data);
    return this.findById(data.id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM patient_requests WHERE id = ?').get(id);
  },

  findAll(opts = {}) {
    let query = 'SELECT * FROM patient_requests';
    const params = [];
    if (opts.status) { query += ' WHERE status = ?'; params.push(opts.status); }
    query += ' ORDER BY created_at DESC';
    if (opts.limit) { query += ' LIMIT ?'; params.push(opts.limit); }
    return db.prepare(query).all(...params);
  },

  updateStatus(id, status, matchedDonorId = null, matchedNgoId = null) {
    db.prepare(`
      UPDATE patient_requests SET status = ?, matched_donor_id = ?, matched_ngo_id = ?
      WHERE id = ?
    `).run(status, matchedDonorId, matchedNgoId, id);
  },
};
