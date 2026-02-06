/**
 * Alert Service
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates Firestore operations for safety alerts
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, Collections } from '../config/firebase';
import { Alert, AlertPriority, AlertStatus } from '../types';

export class AlertService {
  private db = getDb();
  private collection = this.db.collection(Collections.ALERTS);

  /**
   * Create a new alert
   */
  async createAlert(data: Omit<Alert, 'id' | 'createdAt' | 'acknowledgedBy'>): Promise<Alert> {
    const id = uuidv4();
    const now = new Date();

    const alert: Alert = {
      ...data,
      id,
      acknowledgedBy: [],
      createdAt: now
    };

    await this.collection.doc(id).set(alert);
    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string): Promise<Alert | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Alert;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(filters?: {
    priority?: AlertPriority;
    section?: string;
    role?: string;
  }): Promise<Alert[]> {
    let query: FirebaseFirestore.Query = this.collection
      .where('status', '==', 'active');

    if (filters?.priority) {
      query = query.where('priority', '==', filters.priority);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Alert[];

    // Filter by section and role (client-side due to Firestore limitations)
    if (filters?.section) {
      alerts = alerts.filter(alert => 
        alert.targetSections.includes(filters.section!) || 
        alert.targetSections.includes('all')
      );
    }
    if (filters?.role) {
      alerts = alerts.filter(alert => 
        alert.targetRoles.includes(filters.role!) || 
        alert.targetRoles.includes('all')
      );
    }

    // Filter out expired alerts
    const now = new Date();
    alerts = alerts.filter(alert => 
      !alert.expiresAt || new Date(alert.expiresAt) > now
    );

    return alerts;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert | null> {
    const alert = await this.getAlertById(alertId);
    if (!alert) return null;

    if (!alert.acknowledgedBy.includes(userId)) {
      alert.acknowledgedBy.push(userId);
      await this.collection.doc(alertId).update({
        acknowledgedBy: alert.acknowledgedBy
      });
    }

    return alert;
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    await this.collection.doc(id).update({ status });
    return this.getAlertById(id);
  }

  /**
   * Get alerts created by user
   */
  async getAlertsByCreator(userId: string): Promise<Alert[]> {
    const snapshot = await this.collection
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Alert[];
  }

  /**
   * Delete alert
   */
  async deleteAlert(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    await this.collection.doc(id).delete();
    return true;
  }

  /**
   * Create emergency alert (broadcast to all)
   */
  async createEmergencyAlert(
    title: string,
    message: string,
    createdBy: string,
    createdByName: string
  ): Promise<Alert> {
    return this.createAlert({
      title,
      message,
      priority: 'emergency',
      status: 'active',
      targetSections: ['all'],
      targetRoles: ['all'],
      createdBy,
      createdByName
    });
  }
}

export const alertService = new AlertService();
