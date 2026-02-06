/**
 * Checklist Routes
 * CSIR EOI 8119 - Mining Safety Dashboard
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth';
import { checklistService } from '../services/checklistService';

const router = Router();

/**
 * Create a new checklist
 */
router.post(
  '/',
  verifyToken,
  requireRole('admin', 'supervisor'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('category').notEmpty().withMessage('Category is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('assignedTo').notEmpty().withMessage('Assigned user is required'),
    body('assignedToName').notEmpty(),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('mineSection').notEmpty(),
    body('shift').isIn(['day', 'night', 'morning', 'afternoon'])
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

      const checklist = await checklistService.createChecklist({
        ...req.body,
        dueDate: new Date(req.body.dueDate)
      });

      res.status(201).json({
        success: true,
        data: checklist,
        message: 'Checklist created successfully'
      });
    } catch (error: any) {
      console.error('Create checklist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create checklist',
        message: error.message
      });
    }
  }
);

/**
 * Get all checklists with filtering
 */
router.get(
  '/',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as any,
        assignedTo: req.query.assignedTo as string,
        category: req.query.category as string,
        mineSection: req.query.mineSection as string,
        shift: req.query.shift as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const { checklists, total } = await checklistService.getChecklists(filters);

      res.json({
        success: true,
        data: checklists,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          totalPages: Math.ceil(total / filters.limit)
        }
      });
    } catch (error: any) {
      console.error('Get checklists error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checklists',
        message: error.message
      });
    }
  }
);

/**
 * Get checklist by ID
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const checklist = await checklistService.getChecklistById(req.params.id);

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }

    res.json({
      success: true,
      data: checklist
    });
  } catch (error: any) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get checklist',
      message: error.message
    });
  }
});

/**
 * Update checklist item
 */
router.patch(
  '/:checklistId/items/:itemId',
  verifyToken,
  [
    body('isCompleted').optional().isBoolean(),
    body('notes').optional()
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

      const checklist = await checklistService.updateChecklistItem(
        req.params.checklistId,
        req.params.itemId,
        req.body,
        req.uid!
      );

      if (!checklist) {
        return res.status(404).json({
          success: false,
          error: 'Checklist or item not found'
        });
      }

      res.json({
        success: true,
        data: checklist,
        message: 'Checklist item updated'
      });
    } catch (error: any) {
      console.error('Update checklist item error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update checklist item',
        message: error.message
      });
    }
  }
);

/**
 * Get my checklists
 */
router.get('/my/assigned', verifyToken, async (req: Request, res: Response) => {
  try {
    const checklists = await checklistService.getChecklistsByAssignee(req.uid!);

    res.json({
      success: true,
      data: checklists
    });
  } catch (error: any) {
    console.error('Get my checklists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get checklists',
      message: error.message
    });
  }
});

/**
 * Get overdue checklists
 */
router.get(
  '/status/overdue',
  verifyToken,
  requireRole('admin', 'supervisor'),
  async (req: Request, res: Response) => {
    try {
      const checklists = await checklistService.getOverdueChecklists();

      res.json({
        success: true,
        data: checklists
      });
    } catch (error: any) {
      console.error('Get overdue checklists error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get overdue checklists',
        message: error.message
      });
    }
  }
);

/**
 * Delete checklist (admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const deleted = await checklistService.deleteChecklist(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Checklist not found'
        });
      }

      res.json({
        success: true,
        message: 'Checklist deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete checklist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete checklist',
        message: error.message
      });
    }
  }
);

export default router;
