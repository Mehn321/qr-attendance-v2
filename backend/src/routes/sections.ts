import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const db = () => getDatabase();

// GET ALL SECTIONS (for authenticated teacher)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sections = await db().all(
      'SELECT * FROM sections WHERE teacherId = ? ORDER BY createdAt DESC',
      [req.teacherId]
    );

    res.json({ sections });
  } catch (err) {
    console.error('Get sections error:', err);
    res.status(500).json({ message: 'Failed to load sections' });
  }
});

// GET SINGLE SECTION
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [id, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(section);
  } catch (err) {
    console.error('Get section error:', err);
    res.status(500).json({ message: 'Failed to load section' });
  }
});

// CREATE SECTION
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Section name required' });
    }

    // Check if section already exists for this teacher
    const existing = await db().get(
      'SELECT * FROM sections WHERE teacherId = ? AND name = ?',
      [req.teacherId, name.trim()]
    );

    if (existing) {
      return res.status(400).json({ message: 'Section already exists' });
    }

    const id = uuidv4();
    await db().run(
      `INSERT INTO sections (id, teacherId, name, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, req.teacherId, name.trim(), description || null]
    );

    const section = await db().get('SELECT * FROM sections WHERE id = ?', [id]);

    res.status(201).json({ section });
  } catch (err) {
    console.error('Create section error:', err);
    res.status(500).json({ message: 'Failed to create section' });
  }
});

// UPDATE SECTION
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Section name required' });
    }

    // Check if section exists and belongs to teacher
    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [id, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Check if new name already exists for this teacher
    const existing = await db().get(
      'SELECT * FROM sections WHERE teacherId = ? AND name = ? AND id != ?',
      [req.teacherId, name.trim(), id]
    );

    if (existing) {
      return res.status(400).json({ message: 'Section name already exists' });
    }

    await db().run(
      `UPDATE sections 
       SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name.trim(), description || null, id]
    );

    const updated = await db().get('SELECT * FROM sections WHERE id = ?', [id]);

    res.json(updated);
  } catch (err) {
    console.error('Update section error:', err);
    res.status(500).json({ message: 'Failed to update section' });
  }
});

// DELETE SECTION
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const section = await db().get(
      'SELECT * FROM sections WHERE id = ? AND teacherId = ?',
      [id, req.teacherId]
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Delete all attendance records for this section
    await db().run('DELETE FROM attendance WHERE sectionId = ?', [id]);

    // Delete the section
    await db().run('DELETE FROM sections WHERE id = ?', [id]);

    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    console.error('Delete section error:', err);
    res.status(500).json({ message: 'Failed to delete section' });
  }
});

export default router;
