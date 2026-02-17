/**
 * Firebase Configuration
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates Firebase Admin SDK setup and Firestore initialization
 */

import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let db: Firestore;
let auth: Auth;

/**
 * Initialize Firebase Admin SDK
 * Supports both service account file and environment variables
 */
export function initializeFirebase(): void {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase already initialized');
      return;
    }

    // Option 1: Use service account file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // Option 2: Use environment variables with full credentials
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // Option 3: Demo mode - project ID only (no credentials needed)
    else {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'csir-eoi-8119-demo';
      console.log(`Initializing Firebase in demo mode (project: ${projectId})`);

      admin.initializeApp({
        projectId
      });
    }

    // Initialize Firestore and Auth
    db = getFirestore();
    auth = getAuth();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 * Auto-initializes Firebase if not yet initialized
 */
export function getDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

/**
 * Get Firebase Auth instance
 * Auto-initializes Firebase if not yet initialized
 */
export function getAuthInstance(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

/**
 * Firestore collections
 */
export const Collections = {
  USERS: 'users',
  INCIDENTS: 'incidents',
  CHECKLISTS: 'checklists',
  CHECKLIST_ITEMS: 'checklist_items',
  ALERTS: 'alerts',
  LOCATIONS: 'locations',
  ANALYTICS: 'analytics'
} as const;

export default admin;
