/**
 * CSIR EOI 8119 - Mining Safety Dashboard
 * Frontend JavaScript - Pure HTML5/CSS/JS (no frameworks)
 * Demonstrates HTML5, JavaScript, and CSS proficiency
 * PWA-enabled for mobile installation
 */

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );
      console.log("PWA: Service Worker registered", registration.scope);
    } catch (error) {
      console.log("PWA: Service Worker registration failed", error);
    }
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.createElement("button");
  installBtn.id = "installBtn";
  installBtn.className = "btn btn-primary install-btn";
  installBtn.innerHTML = "📱 Install App";
  installBtn.onclick = installPWA;
  document.querySelector(".user-menu")?.prepend(installBtn);
}

async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log("PWA install:", outcome);
  deferredPrompt = null;
  document.getElementById("installBtn")?.remove();
}

// API Configuration
const API_BASE_URL = "/api";
let authToken = null;

// Navigation
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const viewId = btn.dataset.view;
    showView(viewId);
  });
});

function showView(viewId) {
  // Update nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  // Show/hide views
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `${viewId}View`);
  });

  // Load view data
  switch (viewId) {
    case "dashboard":
      loadDashboard();
      break;
    case "incidents":
      loadIncidents();
      break;
    case "checklists":
      loadChecklists();
      break;
    case "alerts":
      loadAlerts();
      break;
  }
}

// API Helper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Dashboard Functions
async function loadDashboard() {
  try {
    // For demo, show sample data
    document.getElementById("todayIncidents").textContent = "3";
    document.getElementById("criticalIncidents").textContent = "1";
    document.getElementById("completedChecklists").textContent = "12";
    document.getElementById("safetyScore").textContent = "87";

    // Update severity breakdown
    document.getElementById("severityCritical").textContent = "1";
    document.getElementById("severityHigh").textContent = "2";
    document.getElementById("severityMedium").textContent = "5";
    document.getElementById("severityLow").textContent = "8";

    // Load recent incidents
    loadRecentIncidents();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
  }
}

function loadRecentIncidents() {
  const tableBody = document.getElementById("recentIncidentsTable");

  // Demo data
  const incidents = [
    {
      title: "Equipment malfunction in Section B",
      type: "equipment_damage",
      severity: "high",
      status: "investigating",
      location: "Section B - Level 3",
      reported: "2 hours ago",
    },
    {
      title: "Near miss at conveyor belt",
      type: "near_miss",
      severity: "medium",
      status: "reported",
      location: "Section A - Level 1",
      reported: "4 hours ago",
    },
    {
      title: "Minor injury during shift change",
      type: "injury",
      severity: "low",
      status: "resolved",
      location: "Section C - Surface",
      reported: "6 hours ago",
    },
  ];

  tableBody.innerHTML = incidents
    .map(
      (incident) => `
    <tr>
      <td>${escapeHtml(incident.title)}</td>
      <td>${formatType(incident.type)}</td>
      <td><span class="badge badge-${incident.severity}">${capitalize(
        incident.severity
      )}</span></td>
      <td><span class="badge badge-${incident.status}">${capitalize(
        incident.status
      )}</span></td>
      <td>${escapeHtml(incident.location)}</td>
      <td>${incident.reported}</td>
    </tr>
  `
    )
    .join("");
}

// Incidents Functions
async function loadIncidents() {
  const tableBody = document.getElementById("incidentsTable");

  try {
    // Demo data - in production, this would fetch from API
    const incidents = [
      {
        id: "1",
        title: "Equipment malfunction in Section B",
        type: "equipment_damage",
        severity: "high",
        status: "investigating",
        location: { section: "Section B", level: "Level 3" },
        reportedByName: "John Smith",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Near miss at conveyor belt",
        type: "near_miss",
        severity: "medium",
        status: "reported",
        location: { section: "Section A", level: "Level 1" },
        reportedByName: "Jane Doe",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    tableBody.innerHTML = incidents
      .map(
        (incident) => `
      <tr>
        <td>${escapeHtml(incident.title)}</td>
        <td>${formatType(incident.type)}</td>
        <td><span class="badge badge-${incident.severity}">${capitalize(
          incident.severity
        )}</span></td>
        <td><span class="badge badge-${incident.status}">${capitalize(
          incident.status
        )}</span></td>
        <td>${incident.location.section} - ${incident.location.level}</td>
        <td>${escapeHtml(incident.reportedByName)}</td>
        <td>${formatDate(incident.createdAt)}</td>
        <td>
          <button class="btn btn-secondary" onclick="viewIncident('${
            incident.id
          }')">View</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Failed to load incidents</td></tr>';
  }
}

function viewIncident(id) {
  openModal(
    "Incident Details",
    `
    <p>Loading incident ${id}...</p>
    <p><em>In production, this would show full incident details with update options.</em></p>
  `
  );
}

// Checklists Functions
async function loadChecklists() {
  const grid = document.getElementById("checklistGrid");

  // Demo data
  const checklists = [
    {
      id: "1",
      title: "Daily Safety Inspection",
      category: "Safety",
      status: "in_progress",
      dueDate: new Date().toISOString(),
      completedItems: 8,
      totalItems: 12,
    },
    {
      id: "2",
      title: "Equipment Pre-Start Check",
      category: "Equipment",
      status: "completed",
      dueDate: new Date().toISOString(),
      completedItems: 10,
      totalItems: 10,
    },
    {
      id: "3",
      title: "Emergency Exit Verification",
      category: "Emergency",
      status: "pending",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      completedItems: 0,
      totalItems: 6,
    },
  ];

  grid.innerHTML = checklists
    .map(
      (checklist) => `
    <div class="checklist-card">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <h4>${escapeHtml(checklist.title)}</h4>
        <span class="badge badge-${checklist.status}">${capitalize(
        checklist.status.replace("_", " ")
      )}</span>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.5rem 0;">
        Category: ${checklist.category}
      </p>
      <div style="margin: 1rem 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Progress</span>
          <span style="font-size: 0.75rem; font-weight: 600;">${
            checklist.completedItems
          }/${checklist.totalItems}</span>
        </div>
        <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${
            (checklist.completedItems / checklist.totalItems) * 100
          }%; background: var(--primary); border-radius: 4px;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.75rem; color: var(--text-secondary);">Due: ${formatDate(
          checklist.dueDate
        )}</span>
        <button class="btn btn-secondary" onclick="viewChecklist('${
          checklist.id
        }')">Open</button>
      </div>
    </div>
  `
    )
    .join("");
}

function viewChecklist(id) {
  openModal(
    "Checklist",
    `
    <p>Loading checklist ${id}...</p>
    <p><em>In production, this would show the checklist items with check/uncheck functionality.</em></p>
  `
  );
}

// Alerts Functions
async function loadAlerts() {
  const list = document.getElementById("alertsList");

  // Demo data
  const alerts = [
    {
      id: "1",
      title: "Scheduled Maintenance Alert",
      message:
        "Conveyor system B will be offline for maintenance from 14:00 to 18:00 today.",
      priority: "warning",
      createdByName: "System",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Safety Briefing Reminder",
      message:
        "All personnel must attend the weekly safety briefing at 08:00 tomorrow.",
      priority: "info",
      createdByName: "Safety Officer",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  if (alerts.length === 0) {
    list.innerHTML = '<div class="empty-state">No active alerts</div>';
    return;
  }

  list.innerHTML = alerts
    .map(
      (alert) => `
    <div class="alert-item ${alert.priority}">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h4 style="font-size: 1rem; font-weight: 600;">${escapeHtml(
          alert.title
        )}</h4>
        <span class="badge badge-${alert.priority}">${capitalize(
        alert.priority
      )}</span>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${escapeHtml(
        alert.message
      )}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
        <span>By: ${escapeHtml(alert.createdByName)}</span>
        <span>${formatDate(alert.createdAt)}</span>
      </div>
      <div style="margin-top: 0.75rem;">
        <button class="btn btn-secondary" onclick="acknowledgeAlert('${
          alert.id
        }')">Acknowledge</button>
      </div>
    </div>
  `
    )
    .join("");
}

function acknowledgeAlert(id) {
  alert(
    `Alert ${id} acknowledged. In production, this would update the alert status.`
  );
}

// Modal Functions
function openModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = content;
  document.getElementById("modalContainer").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalContainer").classList.add("hidden");
}

// Close modal on overlay click
document.getElementById("modalContainer").addEventListener("click", (e) => {
  if (e.target.id === "modalContainer") {
    closeModal();
  }
});

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatType(type) {
  return type.split("_").map(capitalize).join(" ");
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Button Event Handlers
document.getElementById("newIncidentBtn")?.addEventListener("click", () => {
  openModal(
    "Report New Incident",
    `
    <form id="incidentForm">
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 500; margin-bottom: 0.25rem;">Title</label>
        <input type="text" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.375rem;" required>
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 500; margin-bottom: 0.25rem;">Description</label>
        <textarea style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.375rem; min-height: 100px;" required></textarea>
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 500; margin-bottom: 0.25rem;">Severity</label>
        <select style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.375rem;">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Report</button>
    </form>
    <p style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted);">
      <em>In production, this form would submit to the API.</em>
    </p>
  `
  );
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
