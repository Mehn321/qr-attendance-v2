import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const db = () => getDatabase();

// SCAN STUDENT QR (Record attendance)
router.post('/scan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, studentQrData } = req.body;

    if (!sectionId || !studentQrData) {
      return res.status(400).json({
        message: 'Section ID and student QR data required',
      });
    }

    // Parse student QR: {NAME}|{ID}|{COURSE}
    const parts = studentQrData.split('|');
    if (parts.length < 2) {
      return res.status(400).json({
        message: 'Invalid QR format. Expected: NAME|ID|COURSE',
      });
    }

    const studentName = parts[0].trim();
    const studentId = parts[1].trim();
    const course = parts[2]?.trim() || 'Unknown';

    // Verify section exists and belongs to teacher
    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Check today's attendance for this student in this section
    const today = new Date().toISOString().split('T')[0];
    let attendance = await db().get(
      `SELECT * FROM attendance 
       WHERE sectionId = ? AND studentId = ? 
       AND DATE(createdAt) = DATE(?)`,
      [sectionId, studentId, today]
    );

    if (!attendance) {
      // First scan = Time In
      const id = uuidv4();
      await db().run(
        `INSERT INTO attendance 
         (id, sectionId, studentId, studentName, course, timeIn, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, sectionId, studentId, studentName, course]
      );

      attendance = await db().get(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );

      return res.json({
        success: true,
        status: 'IN',
        message: 'Time In recorded',
        timeIn: attendance.timeIn,
        timeOut: null,
        studentName,
        studentId,
      });
    } else if (attendance.timeIn && !attendance.timeOut) {
      // Second scan = Time Out
      await db().run(
        `UPDATE attendance 
         SET timeOut = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [attendance.id]
      );

      const updated = await db().get(
        'SELECT * FROM attendance WHERE id = ?',
        [attendance.id]
      );

      return res.json({
        success: true,
        status: 'OUT',
        message: 'Time Out recorded',
        timeIn: updated.timeIn,
        timeOut: updated.timeOut,
        studentName,
        studentId,
      });
    } else if (attendance.timeIn && attendance.timeOut) {
      // Both exist = already completed today
      return res.status(400).json({
        success: false,
        status: 'COMPLETED',
        message: 'Attendance for today is already complete',
        studentName,
        studentId,
      });
    }
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ message: 'Failed to process scan' });
  }
});

// GET ATTENDANCE STATS FOR TODAY
router.get('/stats/today', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await db().get(
      `SELECT
        COUNT(DISTINCT studentId) as totalPresent,
        COUNT(DISTINCT CASE WHEN timeIn IS NOT NULL AND timeOut IS NULL THEN studentId END) as currentlyIn,
        COUNT(DISTINCT CASE WHEN timeIn IS NOT NULL AND timeOut IS NOT NULL THEN studentId END) as checkedOut
       FROM attendance
       WHERE DATE(createdAt) = DATE(?)`,
      [today]
    );

    res.json({
      totalPresent: stats.totalPresent || 0,
      currentlyIn: stats.currentlyIn || 0,
      checkedOut: stats.checkedOut || 0,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// GET ATTENDANCE FOR SECTION
router.get('/section/:sectionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { date } = req.query;

    // Verify section belongs to teacher
    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Build query
    let query = 'SELECT * FROM attendance WHERE sectionId = ?';
    const params: any[] = [sectionId];

    if (date) {
      query += ' AND DATE(createdAt) = DATE(?)';
      params.push(date);
    }

    query += ' ORDER BY createdAt DESC';

    const records = await db().all(query, params);

    res.json({ records });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ message: 'Failed to load attendance' });
  }
});

// GET ATTENDANCE HISTORY
router.get('/history/section/:sectionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { startDate, endDate, search } = req.query;

    // Verify section belongs to teacher
    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Build query
    let query = 'SELECT * FROM attendance WHERE sectionId = ?';
    const params: any[] = [sectionId];

    if (startDate) {
      query += ' AND DATE(createdAt) >= DATE(?)';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(createdAt) <= DATE(?)';
      params.push(endDate);
    }

    if (search) {
      query += ' AND (studentId LIKE ? OR studentName LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY createdAt DESC LIMIT 500';

    const records = await db().all(query, params);

    res.json({ records });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Failed to load history' });
  }
});

export default router;
