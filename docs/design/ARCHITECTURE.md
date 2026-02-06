# EIO3 Firebase - Architecture Documentation

## CSIR EOI 8119 - Mining Safety Dashboard

### System Architecture

```mermaid
flowchart TB
    subgraph clients [Client Applications]
        Web[Web Dashboard]
        Mobile[Mobile App]
    end

    subgraph api [API Layer]
        Express[Express.js Server]
        Auth[Firebase Auth Middleware]
        Routes[API Routes]
    end

    subgraph firebase [Firebase Services]
        Firestore[(Firestore Database)]
        FireAuth[Firebase Auth]
        CloudFunctions[Cloud Functions]
        Hosting[Firebase Hosting]
    end

    subgraph functions [Cloud Functions]
        OnCreate[onIncidentCreated]
        OnUpdate[onIncidentUpdated]
        Scheduled[Scheduled Tasks]
    end

    Web --> Hosting
    Hosting --> Express
    Mobile --> Express

    Express --> Auth
    Auth --> FireAuth
    Auth --> Routes
    Routes --> Firestore

    Firestore --> OnCreate
    Firestore --> OnUpdate
    Scheduled --> Firestore
```

### Firestore Data Model

```mermaid
erDiagram
    users ||--o{ incidents : reports
    users ||--o{ checklists : assigned
    users ||--o{ alerts : creates

    users {
        string id PK
        string email
        string displayName
        string role
        string department
        string mineSection
        boolean isActive
        timestamp createdAt
    }

    incidents {
        string id PK
        string title
        string description
        enum type
        enum severity
        enum status
        object location
        string reportedBy FK
        array witnesses
        int injuries
        timestamp createdAt
        timestamp resolvedAt
    }

    checklists {
        string id PK
        string title
        string category
        enum status
        array items
        string assignedTo FK
        timestamp dueDate
        timestamp completedAt
    }

    alerts {
        string id PK
        string title
        string message
        enum priority
        enum status
        array targetSections
        array targetRoles
        string createdBy FK
        array acknowledgedBy
        timestamp createdAt
    }
```

### Cloud Functions Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Firestore
    participant CloudFunction
    participant AlertService

    User->>API: POST /incidents (Critical)
    API->>Firestore: Create incident document
    Firestore-->>CloudFunction: Trigger onIncidentCreated
    CloudFunction->>CloudFunction: Check severity
    alt severity is critical or high
        CloudFunction->>AlertService: Create alert
        AlertService->>Firestore: Save alert
    end
    CloudFunction->>Firestore: Update analytics
    API-->>User: Return incident
```

### Component Architecture

```mermaid
flowchart LR
    subgraph backend [Backend Services]
        Server[Express Server]
        AuthMW[Auth Middleware]

        subgraph routes [Routes]
            AuthR[Auth Routes]
            IncidentR[Incident Routes]
            ChecklistR[Checklist Routes]
            AlertR[Alert Routes]
            AnalyticsR[Analytics Routes]
        end

        subgraph services [Services]
            IncidentS[Incident Service]
            ChecklistS[Checklist Service]
            AlertS[Alert Service]
        end
    end

    subgraph frontend [Frontend Dashboard]
        HTML[HTML5]
        CSS[CSS3]
        JS[JavaScript]
    end

    subgraph firebase [Firebase]
        Firestore[(Firestore)]
        Functions[Cloud Functions]
    end

    Server --> AuthMW
    AuthMW --> routes
    routes --> services
    services --> Firestore

    HTML --> JS
    JS --> Server

    Firestore --> Functions
```

### Scheduled Functions

```mermaid
gantt
    title Daily Cloud Functions Schedule
    dateFormat HH:mm

    section Reports
    Daily Report Generation    :06:00, 30m
    Weekly Summary             :08:00, 30m

    section Monitoring
    Check Overdue Checklists   :active, 00:00, 24h

    section Maintenance
    Cleanup Old Records        :00:00, 30m
```

### Security Rules Flow

```mermaid
flowchart TD
    Request[Firestore Request]
    Auth{Authenticated?}
    Role{Check Role}
    Owner{Is Owner?}
    Admin{Is Admin?}

    Request --> Auth
    Auth -->|No| Deny[Deny Access]
    Auth -->|Yes| Role

    Role -->|Read| Allow[Allow Read]
    Role -->|Write| Owner
    Role -->|Delete| Admin

    Owner -->|Yes| Allow
    Owner -->|No| Admin

    Admin -->|Yes| Allow
    Admin -->|No| Deny
```
