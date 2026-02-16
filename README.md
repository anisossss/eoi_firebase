# CSIR EOI 8119 - Mining Safety Dashboard

<div align="center">

![CSIR Logo](https://img.shields.io/badge/CSIR-EOI_8119-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-orange?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)

**Mining Safety Dashboard - Demonstrating Firebase & Cloud Services Proficiency**

</div>

---

## Project Overview

This project demonstrates proficiency in:

- **Firebase** (Firestore, Authentication, Cloud Functions)
- **Node.js + Express** backend API
- **Cloud Services** and serverless functions
- **HTML5, CSS, JavaScript** frontend
- **Docker** containerization

### Technical Evaluation Criteria Addressed

| Criterion              | Implementation                          |
| ---------------------- | --------------------------------------- |
| Firebase proficiency   | Firestore, Auth, Cloud Functions        |
| Node.js                | Express API server                      |
| HTML5, CSS, JavaScript | Pure frontend dashboard                 |
| NoSQL database         | Firestore document database             |
| Cloud services         | Firebase Hosting, Cloud Functions       |
| Background processing  | Firestore triggers, scheduled functions |
| Docker                 | Containerized deployment                |

---

## Technology Stack

| Component | Technology               | Purpose                 |
| --------- | ------------------------ | ----------------------- |
| Backend   | Node.js + Express        | REST API                |
| Database  | Firebase Firestore       | NoSQL document database |
| Auth      | Firebase Authentication  | User management         |
| Functions | Firebase Cloud Functions | Background processing   |
| Hosting   | Firebase Hosting         | Static frontend hosting |
| Container | Docker                   | Containerization        |

---

## Features

### Safety Incident Management

- Report incidents with severity levels
- Track incident status and resolution
- Assign incidents to investigators

### Safety Checklists

- Create and assign safety checklists
- Track completion progress
- Automatic overdue detection

### Alerts System

- Broadcast safety alerts
- Priority-based notifications
- Acknowledgment tracking

### Analytics Dashboard

- Real-time safety statistics
- Incident trends and patterns
- Safety score calculation

### Background Processing

- Automatic incident notifications
- Daily and weekly report generation
- Overdue checklist detection

---

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (or use emulators)

### Local Development

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Start Firebase emulators
firebase emulators:start

# In another terminal, start the API server
npm run dev

# Access:
# - API: http://localhost:5001
# - Frontend: http://localhost:5001
# - Emulator UI: http://localhost:4000
```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# Access API
curl http://localhost:5001/health
```

---

## API Endpoints

### Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register user profile |
| GET    | `/api/auth/me`       | Get current user      |
| PUT    | `/api/auth/me`       | Update profile        |

### Incidents

| Method | Endpoint                    | Description     |
| ------ | --------------------------- | --------------- |
| GET    | `/api/incidents`            | List incidents  |
| POST   | `/api/incidents`            | Create incident |
| GET    | `/api/incidents/:id`        | Get incident    |
| PUT    | `/api/incidents/:id`        | Update incident |
| PATCH  | `/api/incidents/:id/status` | Update status   |

### Checklists

| Method | Endpoint                            | Description      |
| ------ | ----------------------------------- | ---------------- |
| GET    | `/api/checklists`                   | List checklists  |
| POST   | `/api/checklists`                   | Create checklist |
| PATCH  | `/api/checklists/:id/items/:itemId` | Update item      |

### Alerts

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/alerts/active`    | Get active alerts   |
| POST   | `/api/alerts`           | Create alert        |
| POST   | `/api/alerts/emergency` | Emergency broadcast |

### Analytics

| Method | Endpoint                      | Description       |
| ------ | ----------------------------- | ----------------- |
| GET    | `/api/analytics/dashboard`    | Dashboard summary |
| GET    | `/api/analytics/safety-score` | Safety score      |

---

## Cloud Functions

### Firestore Triggers

- `onIncidentCreated`: Notify on new incidents
- `onIncidentUpdated`: Track resolutions
- `onChecklistCompleted`: Update analytics

### Scheduled Functions

- `generateDailyReport`: Daily at 6 AM
- `checkOverdueChecklists`: Hourly
- `generateWeeklySummary`: Monday at 8 AM

---

## Docker Hub

### Pull Command

```bash
docker pull csireoi8119/safety-dashboard:latest
```

### Build and Push

```bash
docker build -t csireoi8119/safety-dashboard:latest .
docker push csireoi8119/safety-dashboard:latest
```

---

## Project Structure

```
EIO3_firebase/
├── src/
│   ├── server.ts           # Express server
│   ├── config/
│   │   └── firebase.ts     # Firebase Admin SDK
│   ├── middleware/
│   │   └── auth.ts         # Authentication
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── incidentRoutes.ts
│   │   ├── checklistRoutes.ts
│   │   ├── alertRoutes.ts
│   │   └── analyticsRoutes.ts
│   ├── services/
│   │   ├── incidentService.ts
│   │   ├── checklistService.ts
│   │   └── alertService.ts
│   └── types/
│       └── index.ts
├── functions/              # Cloud Functions
│   └── src/
│       └── index.ts
├── public/                 # Frontend
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── Dockerfile
├── docker-compose.yml
├── firebase.json
└── package.json
```

---

<div align="center">

**Built for CSIR EOI 8119/06/02/2026**

_Demonstrating Firebase, Cloud Functions, and Node.js Proficiency_

</div>
