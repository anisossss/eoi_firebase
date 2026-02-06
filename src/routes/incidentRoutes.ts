/**
 * Incident Routes
 * CSIR EOI 8119 - Mining Safety Dashboard
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth';
import { incidentService } from '../services/incidentService';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../types';

const router = Router();

/**
 * Create a new incident report
 */
router.post(
  '/',
  verifyToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('type').isIn(['near_miss', 'injury', 'equipment_damage', 'environmental', 'fire', 'structural', 'other']),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('location.section').notEmpty().withMessage('Location section is required'),
    body('location.level').notEmpty().withMessage('Location level is required')
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

      const incidentData = {
        ...req.body,
        reportedBy: req.uid!,
        reportedByName: req.user?.displayName || 'Unknown',
        status: 'reported' as IncidentStatus,
        witnesses: req.body.witnesses || [],
        injuries: req.body.injuries || 0,
        equipmentInvolved: req.body.equipmentInvolved || [],
        attachments: req.body.attachments || []
      };

      const incident = await incidentService.createIncident(incidentData);

      res.status(201).json({
        success: true,
        data: incident,
        message: 'Incident reported successfully'
      });
    } catch (error: any) {
      console.error('Create incident error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create incident',
        message: error.message
      });
    }
  }
);

/**
 * Get all incidents with filtering
 */
router.get(
  '/',
  verifyToken,
  [
    query('status').optional().isIn(['reported', 'investigating', 'resolved', 'closed']),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('type').optional(),
    query('section').optional(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as IncidentStatus | undefined,
        severity: req.query.severity as IncidentSeverity | undefined,
        type: req.query.type as IncidentType | undefined,
        section: req.query.section as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const { incidents, total } = await incidentService.getIncidents(filters);

      res.json({
        success: true,
        data: incidents,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          totalPages: Math.ceil(total / filters.limit!)
        }
      });
    } catch (error: any) {
      console.error('Get incidents error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get incidents',
        message: error.message
      });
    }
  }
);

/**
 * Get incident by ID
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error: any) {
    console.error('Get incident error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incident',
      message: error.message
    });
  }
});

/**
 * Update incident
 */
router.put(
  '/:id',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const incident = await incidentService.updateIncident(req.params.id, req.body);

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found'
        });
      }

      res.json({
        success: true,
        data: incident,
        message: 'Incident updated successfully'
      });
    } catch (error: any) {
      console.error('Update incident error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update incident',
        message: error.message
      });
    }
  }
);

/**
 * Update incident status
 */
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    body('status').isIn(['reported', 'investigating', 'resolved', 'closed'])
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

      const incident = await incidentService.updateIncidentStatus(
        req.params.id,
        req.body.status,
        req.uid!
      );

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found'
        });
      }

      res.json({
        success: true,
        data: incident,
        message: 'Incident status updated'
      });
    } catch (error: any) {
      console.error('Update incident status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update incident status',
        message: error.message
      });
    }
  }
);

/**
 * Get my incidents
 */
router.get('/my/reports', verifyToken, async (req: Request, res: Response) => {
  try {
    const incidents = await incidentService.getIncidentsByReporter(req.uid!);

    res.json({
      success: true,
      data: incidents
    });
  } catch (error: any) {
    console.error('Get my incidents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get incidents',
      message: error.message
    });
  }
});

/**
 * Delete incident (admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const deleted = await incidentService.deleteIncident(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Incident not found'
        });
      }

      res.json({
        success: true,
        message: 'Incident deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete incident error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete incident',
        message: error.message
      });
    }
  }
);

export default router;
