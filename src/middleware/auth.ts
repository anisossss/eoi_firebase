/**
 * Authentication Middleware
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates Firebase Authentication integration
 */

import { Request, Response, NextFunction } from 'express';
import { getAuthInstance, getDb, Collections } from '../config/firebase';
import { User } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      uid?: string;
    }
  }
}

/**
 * Verify Firebase ID token and attach user to request
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuthInstance();

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    req.uid = decodedToken.uid;

    // Get user data from Firestore
    const db = getDb();
    const userDoc = await db.collection(Collections.USERS).doc(decodedToken.uid).get();

    if (userDoc.exists) {
      req.user = {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const auth = getAuthInstance();
      const decodedToken = await auth.verifyIdToken(token);
      req.uid = decodedToken.uid;

      const db = getDb();
      const userDoc = await db.collection(Collections.USERS).doc(decodedToken.uid).get();

      if (userDoc.exists) {
        req.user = {
          id: userDoc.id,
          ...userDoc.data()
        } as User;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
