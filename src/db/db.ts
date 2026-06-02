import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "velolabs.db");

// Initialize Database
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      jobId TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      componentType TEXT,
      manufacturingMethod TEXT,
      material TEXT,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      logs TEXT DEFAULT '',
      originalDimensions TEXT,
      finalDimensions TEXT,
      outputFilePath TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
});

export interface Job {
  jobId: string;
  prompt: string;
  componentType: string | null;
  manufacturingMethod: string | null;
  material: string | null;
  status: string;
  progress: number;
  logs: string;
  originalDimensions: string | null;
  finalDimensions: string | null;
  outputFilePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createJob(jobId: string, prompt: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const query = `
      INSERT INTO jobs (jobId, prompt, status, progress, logs, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [jobId, prompt, "pending", 0, `[SYSTEM] Job created.\n`, now, now], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const fields = Object.keys(updates) as Array<keyof Job>;
    if (fields.length === 0) {
      resolve();
      return;
    }

    const setClauses = fields.map(field => `${field} = ?`).join(", ");
    const values = fields.map(field => {
      const val = updates[field];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });

    const query = `
      UPDATE jobs 
      SET ${setClauses}, updatedAt = ?
      WHERE jobId = ?
    `;

    db.run(query, [...values, now, jobId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function appendJobLog(jobId: string, logLine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const query = `
      UPDATE jobs 
      SET logs = logs || ?, updatedAt = ?
      WHERE jobId = ?
    `;
    db.run(query, [logLine + "\n", now, jobId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getJob(jobId: string): Promise<Job | null> {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM jobs WHERE jobId = ?`;
    db.get(query, [jobId], (err, row) => {
      if (err) reject(err);
      else resolve((row as Job) || null);
    });
  });
}

export function getAllJobs(): Promise<Job[]> {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM jobs ORDER BY createdAt DESC`;
    db.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve((rows as Job[]) || []);
    });
  });
}

/**
 * Transactionally fetches the next pending job from the SQLite queue.
 */
export function getNextPendingJob(): Promise<Job | null> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY createdAt ASC 
      LIMIT 1
    `;
    db.get(query, [], (err, row) => {
      if (err) reject(err);
      else resolve((row as Job) || null);
    });
  });
}
