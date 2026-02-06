/**
 * Firebase Cloud Functions
 * CSIR EOI 8119 - Mining Safety Dashboard
 * 
 * Demonstrates:
 * - Background processing with Cloud Functions
 * - Firestore triggers
 * - Scheduled functions
 * - Cloud services proficiency
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Trigger: When a new incident is created
 * Action: Send notifications and update analytics
 */
export const onIncidentCreated = functions.firestore
  .document('incidents/{incidentId}')
  .onCreate(async (snapshot, context) => {
    const incident = snapshot.data();
    const incidentId = context.params.incidentId;

    console.log(`New incident created: ${incidentId}`, incident);

    try {
      // If critical or high severity, notify supervisors
      if (incident.severity === 'critical' || incident.severity === 'high') {
        await createAlert(
          `New ${incident.severity.toUpperCase()} Incident: ${incident.title}`,
          `${incident.description}\nLocation: ${incident.location?.section || 'Unknown'}`,
          incident.severity === 'critical' ? 'emergency' : 'urgent',
          ['all'],
          ['admin', 'supervisor']
        );
        console.log('Alert created for critical/high severity incident');
      }

      // Update daily analytics
      await updateDailyAnalytics(incident.createdAt, {
        incidentsReported: admin.firestore.FieldValue.increment(1)
      });

      console.log('Incident processing complete');
    } catch (error) {
      console.error('Error processing new incident:', error);
    }
  });

/**
 * Trigger: When an incident status changes
 * Action: Update analytics when resolved
 */
export const onIncidentUpdated = functions.firestore
  .document('incidents/{incidentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const incidentId = context.params.incidentId;

    // Check if status changed to resolved
    if (before.status !== 'resolved' && after.status === 'resolved') {
      console.log(`Incident ${incidentId} resolved`);
      
      await updateDailyAnalytics(new Date(), {
        incidentsResolved: admin.firestore.FieldValue.increment(1)
      });
    }
  });

/**
 * Trigger: When a checklist is completed
 * Action: Update analytics
 */
export const onChecklistCompleted = functions.firestore
  .document('checklists/{checklistId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const checklistId = context.params.checklistId;

    // Check if status changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      console.log(`Checklist ${checklistId} completed`);
      
      await updateDailyAnalytics(new Date(), {
        checklistsCompleted: admin.firestore.FieldValue.increment(1)
      });
    }
  });

/**
 * Scheduled: Daily safety report generation
 * Runs every day at 6 AM South Africa time
 */
export const generateDailyReport = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('Africa/Johannesburg')
  .onRun(async (context) => {
    console.log('Generating daily safety report...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get incidents from yesterday
      const incidentsSnapshot = await db.collection('incidents')
        .where('createdAt', '>=', yesterday)
        .where('createdAt', '<', today)
        .get();

      // Get completed checklists from yesterday
      const checklistsSnapshot = await db.collection('checklists')
        .where('completedAt', '>=', yesterday)
        .where('completedAt', '<', today)
        .get();

      const report = {
        date: yesterday.toISOString().split('T')[0],
        incidentsReported: incidentsSnapshot.size,
        checklistsCompleted: checklistsSnapshot.size,
        generatedAt: new Date()
      };

      // Save report
      await db.collection('daily_reports').add(report);

      console.log('Daily report generated:', report);
    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  });

/**
 * Scheduled: Check for overdue checklists
 * Runs every hour
 */
export const checkOverdueChecklists = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Africa/Johannesburg')
  .onRun(async (context) => {
    console.log('Checking for overdue checklists...');

    try {
      const now = new Date();

      // Find pending/in_progress checklists past due date
      const snapshot = await db.collection('checklists')
        .where('status', 'in', ['pending', 'in_progress'])
        .where('dueDate', '<', now)
        .get();

      const batch = db.batch();
      let overdueCount = 0;

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'overdue' });
        overdueCount++;
      });

      if (overdueCount > 0) {
        await batch.commit();
        console.log(`Marked ${overdueCount} checklists as overdue`);

        // Create alert for overdue checklists
        await createAlert(
          `${overdueCount} Overdue Checklists`,
          `There are ${overdueCount} checklists that are past their due date.`,
          'warning',
          ['all'],
          ['admin', 'supervisor']
        );
      }
    } catch (error) {
      console.error('Error checking overdue checklists:', error);
    }
  });

/**
 * Scheduled: Weekly safety summary
 * Runs every Monday at 8 AM
 */
export const generateWeeklySummary = functions.pubsub
  .schedule('0 8 * * 1')
  .timeZone('Africa/Johannesburg')
  .onRun(async (context) => {
    console.log('Generating weekly safety summary...');

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get weekly statistics
      const incidentsSnapshot = await db.collection('incidents')
        .where('createdAt', '>=', weekAgo)
        .get();

      const checklistsSnapshot = await db.collection('checklists')
        .where('createdAt', '>=', weekAgo)
        .get();

      const completedChecklists = checklistsSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length;

      const summary = {
        weekEnding: new Date().toISOString().split('T')[0],
        totalIncidents: incidentsSnapshot.size,
        totalChecklists: checklistsSnapshot.size,
        completedChecklists,
        completionRate: checklistsSnapshot.size > 0 
          ? Math.round((completedChecklists / checklistsSnapshot.size) * 100) 
          : 0,
        generatedAt: new Date()
      };

      await db.collection('weekly_summaries').add(summary);

      // Create notification
      await createAlert(
        'Weekly Safety Summary Available',
        `Week ending ${summary.weekEnding}: ${summary.totalIncidents} incidents, ${summary.completionRate}% checklist completion rate.`,
        'info',
        ['all'],
        ['admin', 'supervisor']
      );

      console.log('Weekly summary generated:', summary);
    } catch (error) {
      console.error('Error generating weekly summary:', error);
    }
  });

/**
 * HTTP Function: Manual report trigger
 */
export const triggerReport = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { type } = req.body;

    if (type === 'daily') {
      // Trigger daily report manually
      await generateDailyReport.run({} as functions.EventContext);
      res.json({ success: true, message: 'Daily report generation triggered' });
    } else if (type === 'weekly') {
      await generateWeeklySummary.run({} as functions.EventContext);
      res.json({ success: true, message: 'Weekly summary generation triggered' });
    } else {
      res.status(400).json({ error: 'Invalid report type' });
    }
  } catch (error: any) {
    console.error('Error triggering report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create alerts
async function createAlert(
  title: string,
  message: string,
  priority: string,
  targetSections: string[],
  targetRoles: string[]
): Promise<void> {
  await db.collection('alerts').add({
    title,
    message,
    priority,
    status: 'active',
    targetSections,
    targetRoles,
    createdBy: 'system',
    createdByName: 'System',
    acknowledgedBy: [],
    createdAt: new Date()
  });
}

// Helper function to update daily analytics
async function updateDailyAnalytics(
  date: Date | admin.firestore.Timestamp,
  updates: Record<string, any>
): Promise<void> {
  const dateObj = date instanceof admin.firestore.Timestamp ? date.toDate() : date;
  const dateStr = dateObj.toISOString().split('T')[0];
  const analyticsRef = db.collection('analytics').doc(dateStr);

  await analyticsRef.set(updates, { merge: true });
}
