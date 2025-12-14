import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const db = () => getDatabase();

// Teacher Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, fullName, password, confirmPassword } = req.body;

    // Validation
    if (!email || !fullName || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingTeacher = await db().get(
      'SELECT id FROM teachers WHERE email = ?',
      [email]
    );

    if (existingTeacher) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Generate teacher ID
    const teacherId = 'TCHR' + uuidv4().substring(0, 8).toUpperCase();
    const qrCodeData = `TCHR|${teacherId}|${fullName}`;

    // Create teacher
    await db().run(
      `INSERT INTO teachers (id, email, fullName, passwordHash, qrCodeData) 
       VALUES (?, ?, ?, ?, ?)`,
      [teacherId, email, fullName, passwordHash, qrCodeData]
    );

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { teacherId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      teacherId,
      fullName,
      email,
      qrCodeData,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Teacher Login Step 1: Email + Password
router.post('/login/step1', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Get teacher from DB by email
    const teacher = await db().get(
      'SELECT * FROM teachers WHERE email = ?',
      [email]
    );

    if (!teacher) {
      return res.status(401).json({ message: 'Email or password incorrect' });
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, teacher.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email or password incorrect' });
    }

    // Generate temporary token for Step 2 (5 minutes validity)
    const tempToken = jwt.sign(
      { teacherId: teacher.id, step: 1 },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '5m' }
    );

    res.json({
      success: true,
      message: 'Email and password verified. Please scan your QR code.',
      tempToken,
    });
  } catch (err) {
    console.error('Login step 1 error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Teacher Login Step 2: QR Code Verification
router.post('/login/step2', async (req: Request, res: Response) => {
  try {
    const { tempToken, qrCodeData } = req.body;

    if (!tempToken || !qrCodeData) {
      return res.status(400).json({ message: 'Temporary token and QR code required' });
    }

    // Verify temporary token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (decoded.step !== 1) {
      return res.status(401).json({ message: 'Invalid request' });
    }

    const teacherId = decoded.teacherId;

    // Get teacher from DB
    const teacher = await db().get(
      'SELECT * FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (!teacher) {
      return res.status(401).json({ message: 'Teacher not found' });
    }

    // Verify QR code data matches
    if (teacher.qrCodeData !== qrCodeData) {
      return res.status(401).json({ message: 'QR code does not match. Please try again.' });
    }

    // Generate final JWT token
    const token = jwt.sign(
      { teacherId: teacher.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '12h' }
    );

    // Update last login
    await db().run(
      'UPDATE teachers SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?',
      [teacherId]
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      teacherId: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
    });
  } catch (err) {
    console.error('Login step 2 error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get Teacher Profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await db().get(
      'SELECT id, username, email, fullName, qrCodeData, lastLoginAt, createdAt FROM teachers WHERE id = ?',
      [req.teacherId]
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

// Get Dashboard Data
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get teacher info
    const teacher = await db().get(
      'SELECT fullName FROM teachers WHERE id = ?',
      [req.teacherId]
    );

    // Get attendance stats for today
    const stats = await db().get(
      `
      SELECT
        COUNT(DISTINCT a.studentId) as totalPresent,
        COUNT(DISTINCT CASE WHEN a.timeOut IS NULL THEN a.studentId END) as currentlyPresent,
        COUNT(DISTINCT CASE WHEN a.timeIn IS NOT NULL AND a.timeOut IS NOT NULL THEN a.studentId END) as completed,
        COUNT(DISTINCT s.id) as totalSections
      FROM attendance a
      LEFT JOIN sections s ON a.sectionId = s.id
      WHERE DATE(a.timeIn) = DATE('now') AND s.teacherId = ?
      `,
      [req.teacherId]
    );

    // Get sections for this teacher
    const sections = await db().all(
      `SELECT id, name FROM sections WHERE teacherId = ? ORDER BY createdAt DESC`,
      [req.teacherId]
    );

    // Get recent logs
    const logs = await db().all(
      `
      SELECT
        a.id,
        a.studentId,
        a.studentName,
        a.course,
        s.name as section,
        a.timeIn,
        a.timeOut,
        CASE
          WHEN a.timeOut IS NOT NULL THEN 'Out'
          ELSE 'In'
        END as status
      FROM attendance a
      LEFT JOIN sections s ON a.sectionId = s.id
      WHERE s.teacherId = ? AND DATE(a.timeIn) = DATE('now')
      ORDER BY a.createdAt DESC
      LIMIT 20
      `,
      [req.teacherId]
    );

    res.json({
      teacher: teacher?.fullName,
      stats: {
        totalPresent: stats?.totalPresent || 0,
        currentlyPresent: stats?.currentlyPresent || 0,
        completed: stats?.completed || 0,
        totalSections: stats?.totalSections || 0,
      },
      sections,
      logs,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Trim whitespace
    const trimmedCurrentPassword = (currentPassword || '').trim();
    const trimmedNewPassword = (newPassword || '').trim();
    const trimmedConfirmPassword = (confirmPassword || '').trim();

    // Validation
    if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (trimmedNewPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Get teacher from DB
    console.log('🔐 Change password attempt - Teacher ID:', req.teacherId);
    const teacher = await db().get(
      'SELECT * FROM teachers WHERE id = ?',
      [req.teacherId]
    );

    if (!teacher) {
      console.error('❌ Teacher not found in DB:', req.teacherId);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    console.log('👤 Teacher found:', { id: teacher.id, email: teacher.email });

    // Verify current password
    console.log('🔑 Verifying current password against stored hash...');
    const passwordMatch = await bcryptjs.compare(trimmedCurrentPassword, teacher.passwordHash);
    console.log('✓ Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.error('❌ Current password verification failed');
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Ensure new password is different from current
    const isSamePassword = await bcryptjs.compare(trimmedNewPassword, teacher.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const newPasswordHash = await bcryptjs.hash(trimmedNewPassword, salt);

    // Update password
    await db().run(
      'UPDATE teachers SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.teacherId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Token is already validated by authenticateToken middleware
    // Client should delete the token from storage
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
});

export default router;
