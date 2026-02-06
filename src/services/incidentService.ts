/**
 * Incident Service
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates Firestore NoSQL database operations
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, Collections } from '../config/firebase';
import { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '../types';

export class IncidentService {
  private db = getDb();
  private collection = this.db.collection(Collections.INCIDENTS);

  /**
   * Create a new incident report
   */
  async createIncident(data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Promise<Incident> {
    const id = uuidv4();
    const now = new Date();

    const incident: Incident = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.collection.doc(id).set(incident);
    return incident;
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(id: string): Promise<Incident | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Incident;
  }

  /**
   * Get all incidents with filtering
   */
  async getIncidents(filters: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    type?: IncidentType;
    section?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ incidents: Incident[]; total: number }> {
    let query: FirebaseFirestore.Query = this.collection;

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.severity) {
      query = query.where('severity', '==', filters.severity);
    }
    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters.section) {
      query = query.where('location.section', '==', filters.section);
    }
    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    // Get total count (without pagination)
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    const incidents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];

    return { incidents, total };
  }

  /**
   * Update incident
   */
  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    await docRef.update(updateData);
    return this.getIncidentById(id);
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    userId: string
  ): Promise<Incident | null> {
    const updateData: Partial<Incident> = {
      status,
      updatedAt: new Date()
    };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    return this.updateIncident(id, updateData);
  }

  /**
   * Get incidents by reporter
   */
  async getIncidentsByReporter(userId: string): Promise<Incident[]> {
    const snapshot = await this.collection
      .where('reportedBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Incident[];
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    bySeverity: Record<IncidentSeverity, number>;
    byStatus: Record<IncidentStatus, number>;
    byType: Record<IncidentType, number>;
  }> {
    const snapshot = await this.collection
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    const incidents = snapshot.docs.map(doc => doc.data() as Incident);

    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const byStatus = { reported: 0, investigating: 0, resolved: 0, closed: 0 };
    const byType = {
      near_miss: 0, injury: 0, equipment_damage: 0,
      environmental: 0, fire: 0, structural: 0, other: 0
    };

    incidents.forEach(incident => {
      bySeverity[incident.severity]++;
      byStatus[incident.status]++;
      byType[incident.type]++;
    });

    return {
      total: incidents.length,
      bySeverity,
      byStatus,
      byType
    };
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    await this.collection.doc(id).delete();
    return true;
  }
}

export const incidentService = new IncidentService();
