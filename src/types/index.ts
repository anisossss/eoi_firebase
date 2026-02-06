/**
 * TypeScript Type Definitions
 * CSIR EOI 8119 - Mining Safety Dashboard
 */

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'supervisor' | 'operator';
  department: string;
  mineSection: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Incident types
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';
export type IncidentType = 
  | 'near_miss'
  | 'injury'
  | 'equipment_damage'
  | 'environmental'
  | 'fire'
  | 'structural'
  | 'other';

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: {
    section: string;
    level: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  witnesses: string[];
  injuries: number;
  equipmentInvolved: string[];
  rootCause?: string;
  correctiveActions?: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Checklist types
export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  requiresPhoto: boolean;
  photoUrl?: string;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
  assignedTo: string;
  assignedToName: string;
  dueDate: Date;
  completedAt?: Date;
  mineSection: string;
  shift: 'day' | 'night' | 'morning' | 'afternoon';
  createdAt: Date;
  updatedAt: Date;
}

// Alert types
export type AlertPriority = 'info' | 'warning' | 'urgent' | 'emergency';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  targetSections: string[];
  targetRoles: string[];
  createdBy: string;
  createdByName: string;
  acknowledgedBy: string[];
  createdAt: Date;
  expiresAt?: Date;
}

// Analytics types
export interface DailyStats {
  date: string;
  incidentsReported: number;
  incidentsResolved: number;
  checklistsCompleted: number;
  checklistsPending: number;
  alertsIssued: number;
  safetyScore: number;
}

export interface SectionStats {
  section: string;
  incidentCount: number;
  checklistCompletionRate: number;
  lastIncidentDate?: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
