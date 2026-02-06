/**
 * Alert Routes
 * CSIR EOI 8119 - Mining Safety Dashboard
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth';
import { alertService } from '../services/alertService';

const router = Router();

/**
 * Create a new alert
 */
router.post(
  '/',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').isIn(['info', 'warning', 'urgent', 'emergency']),
    body('targetSections').isArray(),
    body('targetRoles').isArray(),
    body('expiresAt').optional().isISO8601()
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

      const alert = await alertService.createAlert({
        ...req.body,
        status: 'active',
        createdBy: req.uid!,
        createdByName: req.user?.displayName || 'Unknown',
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
      });

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Alert created successfully'
      });
    } catch (error: any) {
      console.error('Create alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create alert',
        message: error.message
      });
    }
  }
);

/**
 * Get active alerts for current user
 */
router.get('/active', verifyToken, async (req: Request, res: Response) => {
  try {
    const filters = {
      priority: req.query.priority as any,
      section: req.user?.mineSection,
      role: req.user?.role
    };

    const alerts = await alertService.getActiveAlerts(filters);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

/**
 * Get alert by ID
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    console.error('Get alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert',
      message: error.message
    });
  }
});

/**
 * Acknowledge alert
 */
router.post('/:id/acknowledge', verifyToken, async (req: Request, res: Response) => {
  try {
    const alert = await alertService.acknowledgeAlert(req.params.id, req.uid!);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged'
    });
  } catch (error: any) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * Update alert status
 */
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    body('status').isIn(['active', 'acknowledged', 'resolved'])
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

      const alert = await alertService.updateAlertStatus(req.params.id, req.body.status);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        data: alert,
        message: 'Alert status updated'
      });
    } catch (error: any) {
      console.error('Update alert status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update alert status',
        message: error.message
      });
    }
  }
);

/**
 * Create emergency alert
 */
router.post(
  '/emergency',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required')
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

      const alert = await alertService.createEmergencyAlert(
        req.body.title,
        req.body.message,
        req.uid!,
        req.user?.displayName || 'Unknown'
      );

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Emergency alert broadcast successfully'
      });
    } catch (error: any) {
      console.error('Create emergency alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create emergency alert',
        message: error.message
      });
    }
  }
);

/**
 * Get my created alerts
 */
router.get('/my/created', verifyToken, async (req: Request, res: Response) => {
  try {
    const alerts = await alertService.getAlertsByCreator(req.uid!);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Get my alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

/**
 * Delete alert (admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const deleted = await alertService.deleteAlert(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete alert',
        message: error.message
      });
    }
  }
);

export default router;
