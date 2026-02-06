/**
 * CSIR EOI 8119 - Mining Safety Dashboard API (Demo)
 * Vercel Serverless Function
 */

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "CSIR Mining Safety Dashboard API",
    version: "1.0.0",
    eoi: "8119/06/02/2026",
    status: "running",
    endpoints: [
      "/api/health",
      "/api/incidents",
      "/api/checklists",
      "/api/alerts",
    ],
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Demo incidents
app.get("/api/incidents", (req, res) => {
  res.json({
    incidents: [
      {
        id: "1",
        title: "Equipment Malfunction - Sector B",
        type: "equipment",
        severity: "medium",
        status: "investigating",
        location: "Underground Level 3",
        reportedAt: "2026-02-06T08:30:00Z",
      },
      {
        id: "2",
        title: "Minor Injury Report",
        type: "injury",
        severity: "low",
        status: "resolved",
        location: "Surface Operations",
        reportedAt: "2026-02-06T07:15:00Z",
      },
      {
        id: "3",
        title: "Gas Detection Alert",
        type: "environmental",
        severity: "high",
        status: "reported",
        location: "Ventilation Shaft 2",
        reportedAt: "2026-02-06T09:00:00Z",
      },
    ],
    total: 3,
  });
});

// Demo checklists
app.get("/api/checklists", (req, res) => {
  res.json({
    checklists: [
      {
        id: "1",
        title: "Daily Safety Inspection",
        category: "safety",
        status: "completed",
        completedItems: 12,
        totalItems: 12,
      },
      {
        id: "2",
        title: "Equipment Pre-Start Check",
        category: "equipment",
        status: "in_progress",
        completedItems: 5,
        totalItems: 8,
      },
      {
        id: "3",
        title: "Emergency Evacuation Drill",
        category: "emergency",
        status: "pending",
        completedItems: 0,
        totalItems: 15,
      },
    ],
    total: 3,
  });
});

// Demo alerts
app.get("/api/alerts", (req, res) => {
  res.json({
    alerts: [
      {
        id: "1",
        title: "Shift Change Reminder",
        message: "Day shift ends in 30 minutes",
        priority: "low",
        status: "active",
        createdAt: "2026-02-06T15:30:00Z",
      },
      {
        id: "2",
        title: "Safety Meeting",
        message: "Mandatory safety meeting at 16:00",
        priority: "medium",
        status: "active",
        createdAt: "2026-02-06T14:00:00Z",
      },
    ],
    total: 2,
  });
});

// Dashboard stats
app.get("/api/dashboard", (req, res) => {
  res.json({
    todayIncidents: 3,
    criticalIncidents: 1,
    completedChecklists: 8,
    safetyScore: 94,
    activeAlerts: 2,
    workersOnShift: 145,
  });
});

// Export for Vercel
module.exports = app;
