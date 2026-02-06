/**
 * Analytics Routes
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates data aggregation and analytics
 */

import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth';
import { incidentService } from '../services/incidentService';
import { checklistService } from '../services/checklistService';

const router = Router();

/**
 * Get dashboard summary
 */
router.get('/dashboard', verifyToken, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get today's incident stats
    const todayIncidents = await incidentService.getIncidentStats(startOfDay, now);
    
    // Get weekly incident stats
    const weeklyIncidents = await incidentService.getIncidentStats(startOfWeek, now);
    
    // Get checklist stats
    const checklistStats = await checklistService.getChecklistStats(startOfMonth, now);

    res.json({
      success: true,
      data: {
        today: {
          incidentsReported: todayIncidents.total,
          criticalIncidents: todayIncidents.bySeverity.critical + todayIncidents.bySeverity.high
        },
        weekly: {
          totalIncidents: weeklyIncidents.total,
          resolvedIncidents: weeklyIncidents.byStatus.resolved + weeklyIncidents.byStatus.closed,
          pendingIncidents: weeklyIncidents.byStatus.reported + weeklyIncidents.byStatus.investigating,
          bySeverity: weeklyIncidents.bySeverity,
          byType: weeklyIncidents.byType
        },
        monthly: {
          checklistsCompleted: checklistStats.completed,
          checklistsPending: checklistStats.pending,
          checklistsOverdue: checklistStats.overdue,
          completionRate: checklistStats.completionRate
        },
        lastUpdated: now.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

/**
 * Get incident analytics
 */
router.get(
  '/incidents',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required')
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

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const stats = await incidentService.getIncidentStats(startDate, endDate);

      res.json({
        success: true,
        data: {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          ...stats
        }
      });
    } catch (error: any) {
      console.error('Get incident analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get incident analytics',
        message: error.message
      });
    }
  }
);

/**
 * Get checklist analytics
 */
router.get(
  '/checklists',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required')
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

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const stats = await checklistService.getChecklistStats(startDate, endDate);

      res.json({
        success: true,
        data: {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          ...stats
        }
      });
    } catch (error: any) {
      console.error('Get checklist analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checklist analytics',
        message: error.message
      });
    }
  }
);

/**
 * Get safety score
 */
router.get('/safety-score', verifyToken, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidentStats = await incidentService.getIncidentStats(thirtyDaysAgo, now);
    const checklistStats = await checklistService.getChecklistStats(thirtyDaysAgo, now);

    // Calculate safety score (0-100)
    // Formula: Base 100, minus points for incidents, plus points for checklist completion
    let score = 100;
    
    // Deduct points for incidents
    score -= incidentStats.bySeverity.critical * 15;
    score -= incidentStats.bySeverity.high * 10;
    score -= incidentStats.bySeverity.medium * 5;
    score -= incidentStats.bySeverity.low * 2;
    
    // Add points for checklist completion (up to 20 bonus points)
    score += (checklistStats.completionRate / 100) * 20;
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    res.json({
      success: true,
      data: {
        score: Math.round(score),
        factors: {
          incidentImpact: -(
            incidentStats.bySeverity.critical * 15 +
            incidentStats.bySeverity.high * 10 +
            incidentStats.bySeverity.medium * 5 +
            incidentStats.bySeverity.low * 2
          ),
          checklistBonus: Math.round((checklistStats.completionRate / 100) * 20)
        },
        period: '30 days',
        lastUpdated: now.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Get safety score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate safety score',
      message: error.message
    });
  }
});

export default router;
