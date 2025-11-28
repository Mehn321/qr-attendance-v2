import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcryptjs from 'bcryptjs';

const router = express.Router();
const db = () => getDatabase();

// Teacher scans student QR code (automatic Time In/Out with 1-minute cooldown)
router.post('/scan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, studentQrData } = req.body;

    if (!sectionId || !studentQrData) {
      return res.status(400).json({ message: 'Section and student QR code required' });
    }

    // Parse student QR: "{STUDENT_NAME}|{STUDENT_ID}|{COURSE}"
    const parts = studentQrData.split('|');
    if (parts.length < 2) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const studentName = parts[0];
    const studentId = parts[1];
    const course = parts[2] || '';

    // Verify section belongs to teacher
    const section = await db().get(
      'SELECT id FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if student has attendance record in this section today
    let attendance = await db().get(
      `SELECT id, timeIn, timeOut FROM attendance 
       WHERE sectionId = ? AND studentId = ? AND DATE(timeIn) = ?`,
      [sectionId, studentId, today]
    );

    if (!attendance) {
      // First scan = Time In
      const id = uuidv4();
      await db().run(
        `INSERT INTO attendance (id, sectionId, studentId, studentName, course, timeIn, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, sectionId, studentId, studentName, course]
      );

      return res.status(201).json({
        message: 'Time In recorded',
        status: 'IN',
        studentName,
        studentId,
        timeIn: now.toISOString(),
        timeOut: null,
        nextActionAfter: 60, // seconds before can scan out
      });
    } else if (attendance.timeIn && !attendance.timeOut) {
      // Check 60-second cooldown
      const timeInDate = new Date(attendance.timeIn);
      const secondsElapsed = (now.getTime() - timeInDate.getTime()) / 1000;

      if (secondsElapsed < 60) {
        const remaining = Math.ceil(60 - secondsElapsed);
        return res.status(429).json({
          message: `Wait ${remaining} seconds before scanning out`,
          status: 'COOLDOWN',
          secondsRemaining: remaining,
          studentName,
        });
      }

      // 60+ seconds elapsed = Time Out
      await db().run(
        'UPDATE attendance SET timeOut = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [attendance.id]
      );

      return res.json({
        message: 'Time Out recorded',
        status: 'OUT',
        studentName,
        studentId,
        timeIn: timeInDate.toISOString(),
        timeOut: now.toISOString(),
      });
    } else {
      // Both timeIn and timeOut exist = already completed
      return res.status(400).json({
        message: 'Attendance already recorded. Cannot scan again.',
        status: 'COMPLETED',
        studentName,
      });
    }
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ message: 'Failed to process scan' });
  }
});

// Get attendance history for a section
router.get('/section/:sectionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { date } = req.query;

    // Verify section belongs to teacher
    const section = await db().get(
      'SELECT id, name FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    let query = `SELECT id, studentId, studentName, course, timeIn, timeOut, createdAt 
                FROM attendance 
                WHERE sectionId = ?`;
    const params: any[] = [sectionId];

    if (date) {
      query += ` AND DATE(timeIn) = ?`;
      params.push(date);
    }

    query += ` ORDER BY timeIn DESC LIMIT 200`;

    const records = await db().all(query, params);

    res.json({
      section: section.name,
      records: records.map((r: any) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        course: r.course,
        timeIn: r.timeIn,
        timeOut: r.timeOut,
        status: r.timeOut ? 'OUT' : 'IN',
        duration: r.timeOut ? Math.floor((new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 1000) : null,
      })),
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Failed to load history' });
  }
});

// Get today's attendance for all sections
router.get('/today', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const records = await db().all(
      `SELECT a.id, a.studentId, a.studentName, a.course, a.timeIn, a.timeOut, s.name as section
       FROM attendance a
       JOIN sections s ON a.sectionId = s.id
       WHERE s.teacherId = ? AND DATE(a.timeIn) = ?
       ORDER BY a.timeIn DESC`,
      [req.teacherId, today]
    );

    res.json({ records });
  } catch (err) {
    console.error('Today attendance error:', err);
    res.status(500).json({ message: 'Failed to load today attendance' });
  }
});

// Get attendance statistics for dashboard
router.get('/stats/today', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await db().get(
      `SELECT
        COUNT(DISTINCT a.studentId) as totalPresent,
        COUNT(DISTINCT CASE WHEN a.timeOut IS NULL THEN a.studentId END) as currentlyPresent,
        COUNT(DISTINCT CASE WHEN a.timeOut IS NOT NULL THEN a.studentId END) as checkedOut,
        COUNT(DISTINCT s.id) as activeSections
       FROM attendance a
       JOIN sections s ON a.sectionId = s.id
       WHERE s.teacherId = ? AND DATE(a.timeIn) = ?`,
      [req.teacherId, today]
    );

    res.json({
      date: today,
      totalPresent: stats?.totalPresent || 0,
      currentlyPresent: stats?.currentlyPresent || 0,
      checkedOut: stats?.checkedOut || 0,
      activeSections: stats?.activeSections || 0,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to load statistics' });
  }
});

// Manual attendance entry (requires password verification)
router.post('/manual', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, studentId, studentName, course, timeIn, timeOut, password } = req.body;

    if (!sectionId || !studentId || !studentName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify section belongs to teacher
    const section = await db().get(
      'SELECT id FROM sections WHERE id = ? AND teacherId = ?',
      [sectionId, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Verify teacher password
    const teacher = await db().get(
      'SELECT passwordHash FROM teachers WHERE id = ?',
      [req.teacherId]
    );

    if (!teacher) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const passwordMatch = await bcryptjs.compare(password, teacher.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const id = uuidv4();
    const now = new Date();

    await db().run(
      `INSERT INTO attendance (id, sectionId, studentId, studentName, course, timeIn, timeOut, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, sectionId, studentId, studentName, course || null, timeIn || now.toISOString(), timeOut || null]
    );

    res.status(201).json({ message: 'Attendance record added' });
  } catch (err) {
    console.error('Manual entry error:', err);
    res.status(500).json({ message: 'Failed to add attendance record' });
  }
});

// Delete attendance record (requires password)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    // Verify teacher password
    const teacher = await db().get(
      'SELECT passwordHash FROM teachers WHERE id = ?',
      [req.teacherId]
    );

    const passwordMatch = await bcryptjs.compare(password, teacher.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify attendance belongs to teacher's section
    const attendance = await db().get(
      `SELECT a.id FROM attendance a
       JOIN sections s ON a.sectionId = s.id
       WHERE a.id = ? AND s.teacherId = ?`,
      [id, req.teacherId]
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await db().run('DELETE FROM attendance WHERE id = ?', [id]);

    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete record' });
  }
});

export default router;
