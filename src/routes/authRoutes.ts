/**
 * Authentication Routes
 * CSIR EOI 8119 - Mining Safety Dashboard
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb, getAuthInstance, Collections } from '../config/firebase';
import { verifyToken } from '../middleware/auth';
import { User } from '../types';

const router = Router();

/**
 * Register user profile in Firestore after Firebase Auth registration
 */
router.post(
  '/register',
  [
    body('uid').notEmpty().withMessage('UID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('role').isIn(['admin', 'supervisor', 'operator']).withMessage('Invalid role'),
    body('department').notEmpty().withMessage('Department is required'),
    body('mineSection').notEmpty().withMessage('Mine section is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { uid, email, displayName, role, department, mineSection } = req.body;
      const db = getDb();

      // Check if user already exists
      const existingUser = await db.collection(Collections.USERS).doc(uid).get();
      if (existingUser.exists) {
        return res.status(400).json({
          success: false,
          error: 'User already registered'
        });
      }

      const now = new Date();
      const user: User = {
        id: uid,
        email,
        displayName,
        role,
        department,
        mineSection,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      await db.collection(Collections.USERS).doc(uid).set(user);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully'
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: error.message
      });
    }
  }
);

/**
 * Get current user profile
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message
    });
  }
});

/**
 * Update user profile
 */
router.put(
  '/me',
  verifyToken,
  [
    body('displayName').optional().notEmpty(),
    body('department').optional().notEmpty(),
    body('mineSection').optional().notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      if (!req.uid) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const { displayName, department, mineSection } = req.body;
      const db = getDb();

      const updateData: Partial<User> = {
        updatedAt: new Date()
      };

      if (displayName) updateData.displayName = displayName;
      if (department) updateData.department = department;
      if (mineSection) updateData.mineSection = mineSection;

      await db.collection(Collections.USERS).doc(req.uid).update(updateData);

      const updatedDoc = await db.collection(Collections.USERS).doc(req.uid).get();

      res.json({
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() },
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }
);

/**
 * Get all users (admin only)
 */
router.get('/users', verifyToken, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const db = getDb();
    const snapshot = await db.collection(Collections.USERS)
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: error.message
    });
  }
});

export default router;
