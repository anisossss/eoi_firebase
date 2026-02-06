/**
 * Checklist Service
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates Firestore NoSQL database operations for safety checklists
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, Collections } from '../config/firebase';
import { Checklist, ChecklistItem, ChecklistStatus } from '../types';

export class ChecklistService {
  private db = getDb();
  private collection = this.db.collection(Collections.CHECKLISTS);

  /**
   * Create a new checklist
   */
  async createChecklist(data: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Checklist> {
    const id = uuidv4();
    const now = new Date();

    // Ensure each item has an ID
    const items = data.items.map(item => ({
      ...item,
      id: item.id || uuidv4(),
      isCompleted: false
    }));

    const checklist: Checklist = {
      ...data,
      id,
      items,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await this.collection.doc(id).set(checklist);
    return checklist;
  }

  /**
   * Get checklist by ID
   */
  async getChecklistById(id: string): Promise<Checklist | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Checklist;
  }

  /**
   * Get checklists with filtering
   */
  async getChecklists(filters: {
    status?: ChecklistStatus;
    assignedTo?: string;
    category?: string;
    mineSection?: string;
    shift?: string;
    dueBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ checklists: Checklist[]; total: number }> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.assignedTo) {
      query = query.where('assignedTo', '==', filters.assignedTo);
    }
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.mineSection) {
      query = query.where('mineSection', '==', filters.mineSection);
    }
    if (filters.shift) {
      query = query.where('shift', '==', filters.shift);
    }
    if (filters.dueBefore) {
      query = query.where('dueDate', '<=', filters.dueBefore);
    }

    query = query.orderBy('dueDate', 'asc');

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const checklists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Checklist[];

    return { checklists, total };
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    checklistId: string,
    itemId: string,
    updates: Partial<ChecklistItem>,
    userId: string
  ): Promise<Checklist | null> {
    const checklist = await this.getChecklistById(checklistId);
    if (!checklist) return null;

    const itemIndex = checklist.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    // Update the item
    checklist.items[itemIndex] = {
      ...checklist.items[itemIndex],
      ...updates,
      completedAt: updates.isCompleted ? new Date() : undefined,
      completedBy: updates.isCompleted ? userId : undefined
    };

    // Calculate new status
    const completedCount = checklist.items.filter(item => item.isCompleted).length;
    let newStatus: ChecklistStatus = 'pending';
    
    if (completedCount === checklist.items.length) {
      newStatus = 'completed';
    } else if (completedCount > 0) {
      newStatus = 'in_progress';
    } else if (new Date() > new Date(checklist.dueDate)) {
      newStatus = 'overdue';
    }

    const updateData = {
      items: checklist.items,
      status: newStatus,
      updatedAt: new Date(),
      completedAt: newStatus === 'completed' ? new Date() : null
    };

    await this.collection.doc(checklistId).update(updateData);
    return this.getChecklistById(checklistId);
  }

  /**
   * Get checklists assigned to user
   */
  async getChecklistsByAssignee(userId: string): Promise<Checklist[]> {
    const snapshot = await this.collection
      .where('assignedTo', '==', userId)
      .orderBy('dueDate', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Checklist[];
  }

  /**
   * Get overdue checklists
   */
  async getOverdueChecklists(): Promise<Checklist[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where('status', 'in', ['pending', 'in_progress'])
      .where('dueDate', '<', now)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Checklist[];
  }

  /**
   * Get checklist completion statistics
   */
  async getChecklistStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    byCategory: Record<string, { total: number; completed: number }>;
  }> {
    const snapshot = await this.collection
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    const checklists = snapshot.docs.map(doc => doc.data() as Checklist);
    
    const stats = {
      total: checklists.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0,
      byCategory: {} as Record<string, { total: number; completed: number }>
    };

    checklists.forEach(checklist => {
      // Count by status
      if (checklist.status === 'completed') {
        stats.completed++;
      } else if (checklist.status === 'overdue') {
        stats.overdue++;
      } else {
        stats.pending++;
      }

      // Count by category
      if (!stats.byCategory[checklist.category]) {
        stats.byCategory[checklist.category] = { total: 0, completed: 0 };
      }
      stats.byCategory[checklist.category].total++;
      if (checklist.status === 'completed') {
        stats.byCategory[checklist.category].completed++;
      }
    });

    stats.completionRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;

    return stats;
  }

  /**
   * Delete checklist
   */
  async deleteChecklist(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    await this.collection.doc(id).delete();
    return true;
  }
}

export const checklistService = new ChecklistService();
