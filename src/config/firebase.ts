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
    // Option 2: Use environment variables
    else if (process.env.FIREBASE_PROJECT_ID) {
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
    // Option 3: Use emulator for development
    else {
      console.log('Using Firebase Emulator');
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      
      admin.initializeApp({
        projectId: 'csir-eoi-8119-demo'
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
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

/**
 * Get Firebase Auth instance
 */
export function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
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
