import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import bcryptjs from 'bcryptjs';

let db: any = null;

export async function initializeDatabase() {
  const dbPath = process.env.DB_PATH || './data/attendance.db';

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      qrCodeData TEXT NOT NULL,
      lastLoginAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacherId) REFERENCES teachers(id),
      UNIQUE(teacherId, name)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      sectionId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      course TEXT,
      timeIn DATETIME,
      timeOut DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sectionId) REFERENCES sections(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance(studentId);
    CREATE INDEX IF NOT EXISTS idx_attendance_sectionId ON attendance(sectionId);
    CREATE INDEX IF NOT EXISTS idx_attendance_timeIn ON attendance(timeIn);
    CREATE INDEX IF NOT EXISTS idx_sections_teacherId ON sections(teacherId);
  `);

  // Seed default teacher (optional)
  const teacherCount = await db.get('SELECT COUNT(*) as count FROM teachers');
  if (teacherCount.count === 0) {
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash('teacher123', salt);

    await db.run(
      `INSERT INTO teachers (id, email, fullName, passwordHash, qrCodeData) VALUES (?, ?, ?, ?, ?)`,
      ['TCHR001', 'teacher@demo.com', 'Demo Teacher', passwordHash, 'TCHR|TCHR001|Demo Teacher']
    );

    console.log('Default teacher created: ID=TCHR001, Password=teacher123');
  }

  console.log('Database initialized successfully');
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
