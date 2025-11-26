import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const db = () => getDatabase();

// TEACHER REGISTRATION - Step 1: Validate and prepare for QR verification (NO ACCOUNT CREATION YET)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, fullName, password, confirmPassword } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({
        message: 'Email, full name, and password are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if email already exists (verified accounts only)
    const verifiedExisting = await db().get(
      'SELECT * FROM teachers WHERE email = ? AND isVerified = 1',
      [email]
    );

    if (verifiedExisting) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Clean up any orphaned unverified accounts with same email
    // (This handles old temporary accounts from before the fix)
    try {
      await db().run(
        'DELETE FROM teachers WHERE email = ? AND isVerified = 0',
        [email]
      );
      console.log('🧹 Cleaned up orphaned unverified account for email:', email);
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean orphaned accounts:', cleanupErr);
      // Don't block registration if cleanup fails
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // DO NOT CREATE ACCOUNT YET - Just store in temporary registration session
    // Generate temporary credentials (will be stored in memory/cache, not DB)
    const tempTeacherId = 'TEMP_' + uuidv4().replace(/-/g, '').substring(0, 10);

    // Generate temporary token for QR scanning (5 minutes)
    // Store password hash and other data in the token itself
    const tempToken = jwt.sign(
      {
        tempTeacherId: tempTeacherId,
        email: email,
        fullName: fullName,
        passwordHash: passwordHash,
        step: 'register',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '5m' }
    );

    res.status(201).json({
      success: true,
      message: 'Validation successful. Now scan your QR code to complete registration.',
      tempToken,
      tempTeacherId,
      fullName,
      email,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// TEACHER REGISTRATION - Step 2: Verify QR and CREATE account (ONLY IF QR SCAN SUCCESSFUL)
router.post('/register/verify-qr', async (req: Request, res: Response) => {
  try {
    const { tempToken, qrCodeData } = req.body;

    if (!tempToken || !qrCodeData) {
      return res.status(400).json({
        message: 'Temporary token and QR code data required',
      });
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({
        message: 'Session expired. Please register again.',
      });
    }

    if (decoded.step !== 'register') {
      return res.status(401).json({
        message: 'Invalid request',
      });
    }

    // Extract registration data from token (not from DB)
    const { email, fullName, passwordHash } = decoded;

    if (!email || !fullName || !passwordHash) {
      return res.status(401).json({
        message: 'Registration session corrupted. Please register again.',
      });
    }

    // Parse and validate QR code format: NAME ID PROGRAM
    const parseQR = (qr: string) => {
      const parts = qr.trim().split(/\s+/).filter(p => p.length > 0);
      if (parts.length < 3) return null;
      
      return {
        name: parts.slice(0, parts.length - 2).join(' '),
        id: parts[parts.length - 2],
        program: parts[parts.length - 1],
      };
    };

    const scannedParsed = parseQR(qrCodeData);
    if (!scannedParsed) {
      return res.status(400).json({
        message: 'Invalid QR code format. Expected: NAME ID PROGRAM',
      });
    }

    console.log('📋 Registration QR parsed:', scannedParsed);
    console.log('📋 Teacher name from registration:', fullName);

    // Verify the scanned name matches the registered full name (case-insensitive)
    if (scannedParsed.name.toLowerCase() !== fullName.toLowerCase()) {
      return res.status(401).json({
        message: 'QR code name does not match your registered name. Please scan the correct QR code.',
      });
    }

    // Generate real teacher ID from the QR code
    const realTeacherId = scannedParsed.id;

    // NOW CREATE THE ACCOUNT - ONLY AFTER SUCCESSFUL QR VERIFICATION
    try {
      await db().run(
        `INSERT INTO teachers (id, email, fullName, passwordHash, qrCodeData, isVerified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [realTeacherId, email, fullName, passwordHash, qrCodeData, 1]
      );
    } catch (dbErr: any) {
      // Handle if account somehow already exists
      if (dbErr.message && dbErr.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          message: 'This teacher ID is already registered. Please contact administrator.',
        });
      }
      throw dbErr;
    }

    // Generate final JWT token
    const token = jwt.sign(
      { teacherId: realTeacherId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created and verified successfully',
      token,
      teacherId: realTeacherId,
      fullName: fullName,
      email: email,
      qrCodeData,
    });
  } catch (err) {
    console.error('Registration QR verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// LOGIN STEP 1: Email + Password
router.post('/login/step1', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    // Get teacher from DB
    const teacher = await db().get(
      'SELECT * FROM teachers WHERE email = ?',
      [email]
    );

    if (!teacher) {
      return res.status(401).json({
        message: 'Email or password incorrect',
      });
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, teacher.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Email or password incorrect',
      });
    }

    // Generate temporary token (5 minutes)
    const tempToken = jwt.sign(
      { teacherId: teacher.id, type: 'temp' },
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

// LOGIN STEP 2: QR Code Verification
router.post('/login/step2', async (req: Request, res: Response) => {
  try {
    const { tempToken, qrCodeData } = req.body;

    if (!tempToken || !qrCodeData) {
      return res.status(400).json({
        message: 'Temporary token and QR code data required',
      });
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({
        message: 'Session expired. Please login again.',
      });
    }

    // Get teacher from DB using email stored in temp token
    const teacher = await db().get(
      'SELECT * FROM teachers WHERE email = ?',
      [decoded.email] // Note: frontend should pass email in tempToken
    );

    if (!teacher || !teacher.isVerified) {
      return res.status(401).json({
        message: 'Teacher account not found or not verified',
      });
    }

    // Parse QR code format: NAME ID PROGRAM
    const parseQR = (qr: string) => {
      const parts = qr.trim().split(/\s+/).filter(p => p.length > 0);
      if (parts.length < 3) return null;
      
      return {
        name: parts.slice(0, parts.length - 2).join(' '),
        id: parts[parts.length - 2],
        program: parts[parts.length - 1],
      };
    };
    
    const scannedParsed = parseQR(qrCodeData);
    const storedParsed = parseQR(teacher.qrCodeData);
    
    console.log('📋 Scanned QR parsed:', scannedParsed);
    console.log('📋 Stored QR parsed:', storedParsed);
    
    // Verify QR code matches
    if (!scannedParsed) {
      return res.status(401).json({
        message: 'Invalid QR code format. Expected: NAME ID PROGRAM',
      });
    }

    if (!storedParsed) {
      return res.status(401).json({
        message: 'Teacher QR code is invalid. Please contact administrator.',
      });
    }

    // Check if teacher ID matches
    if (scannedParsed.id !== storedParsed.id) {
      console.log('❌ QR Code ID Mismatch - Scanned ID:', scannedParsed.id, 'Stored ID:', storedParsed.id);
      return res.status(401).json({
        message: `❌ QR Code Mismatch\n\nScanned QR does not match your account.\n\nYour QR ID: ${storedParsed.id}\nScanned QR ID: ${scannedParsed.id}\n\nPlease scan your correct teacher QR code.`,
      });
    }

    // Check if name matches (case-insensitive)
    if (scannedParsed.name.toLowerCase() !== storedParsed.name.toLowerCase()) {
      console.log('❌ QR Code Name Mismatch - Scanned Name:', scannedParsed.name, 'Stored Name:', storedParsed.name);
      return res.status(401).json({
        message: `❌ QR Code Name Mismatch\n\nScanned QR name does not match your registered name.\n\nYour Name: ${storedParsed.name}\nScanned Name: ${scannedParsed.name}\n\nPlease scan your correct teacher QR code.`,
      });
    }

    // Generate final JWT token (12 hours)
    const token = jwt.sign(
      { teacherId: teacher.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '12h' }
    );

    // Update last login
    await db().run(
      'UPDATE teachers SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?',
      [teacher.id]
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

// TEACHER LOGOUT
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// GET TEACHER PROFILE
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await db().get(
      'SELECT id, email, fullName, createdAt FROM teachers WHERE id = ?',
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

export default router;
