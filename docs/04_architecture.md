# BloodLink — Technical Architecture

## Component Architecture Diagram

```mermaid
graph TD
    subgraph Browser["Browser (React SPA)"]
        App["App.jsx\nRoot Provider"]
        CTX["AppContext.jsx\nGlobal State + Matching Logic"]
        NB["Navbar.jsx"]
        NT["NotificationToast.jsx"]
        DNM["DonorNotificationModal.jsx\n[Volunteer-only popup]"]

        subgraph Pages["Pages"]
            LP["LandingPage.jsx"]
            PP["PatientPortal.jsx\nManual + Auto mode"]
            NP["NgoPortal.jsx\nInventory · Vols · Requests"]
            VP["VolunteerPortal.jsx\nRegister · Login · Dashboard"]
            MP["MatchPage.jsx\nFind Blood (public)"]
        end

        subgraph Components["New Components"]
            AME["AutoMatchEngine.jsx\nModeToggle + AutoMatchLauncher + StatusBox"]
            NAR["NGOActiveRequests.jsx\nLive auto-match panel"]
        end

        subgraph Hooks["Hooks"]
            USK["useSocket.js\nShared Socket.IO connection"]
        end

        App --> CTX
        App --> NB & NT & DNM
        App --> Pages
        PP --> AME
        NP --> NAR
        DNM --> USK
        AME --> USK
        NAR --> USK
        VP --> USK
    end

    subgraph Server["Dispatch Server (Node.js)"]
        IDX["server/index.js\nExpress + Socket.IO"]
        ME["server/matchingEngine.js\nrankCandidates()"]
        DB["server/db.js\nIn-memory Maps"]
        BC["server/bloodCompat.js\nCompatibility Matrix"]
        IDX --> ME
        IDX --> DB
        ME --> BC
        ME --> DB
    end

    USK <-->|WebSocket| IDX
```

---

## Frontend File Map

```
src/
├── App.jsx                         # Root: wraps AppProvider, renders all pages
├── main.jsx                        # React DOM entry point
├── index.css                       # Global design system (CSS variables, components)
│
├── context/
│   └── AppContext.jsx              # Central state: NGOs, Volunteers, Patients, Matching
│
├── hooks/
│   └── useSocket.js                # Socket.IO client hook (shared connection)
│
├── pages/
│   ├── LandingPage.jsx             # Home: stats, hero, how it works
│   ├── PatientPortal.jsx           # 3-step form + Manual/Auto match results
│   ├── NgoPortal.jsx               # NGO login, dashboard: inventory/volunteers/requests
│   ├── VolunteerPortal.jsx         # Register, login, volunteer dashboard
│   └── MatchPage.jsx               # Public blood finder (no registration needed)
│
└── components/
    ├── Navbar.jsx                  # Top nav with tab routing + user session
    ├── NotificationToast.jsx       # In-app notification toasts
    ├── DonorNotificationModal.jsx  # Full-screen popup for incoming blood requests
    ├── AutoMatchEngine.jsx         # ModeToggle, AutoMatchLauncher, StatusBox
    └── NGOActiveRequests.jsx       # Real-time auto-match requests in NGO dashboard
```

---

## Backend File Map

```
server/
├── index.js                # Express + Socket.IO server (port 3001)
│                           # REST: GET /api/health, GET /api/requests
│                           # Socket events: register, autoMatch, donor:accept/reject
│
├── matchingEngine.js       # rankCandidates(request, donors, ngos)
│                           # Uses Haversine + scoring formula
│
├── db.js                   # In-memory Maps:
│                           #   bloodRequests, donorAvailability, ngoReservations
│                           #   donorSockets, patientSockets, ngoSockets, dispatchTimers
│                           # Helper fns: isDonorAvailable, lockDonor, reserveNgoStock
│
└── bloodCompat.js          # BLOOD_COMPATIBILITY matrix (server-side mirror)
```

---

## State Management Architecture

```mermaid
graph LR
    subgraph AppContext["AppContext (React State)"]
        U[user\nnull | patient | ngo | volunteer]
        N[ngos[]\nNGO records + inventory]
        V[volunteers[]\nAll registered volunteers]
        PR[patientRequests[]\nAll submitted requests]
        NO[notifications[]\nToast queue]
        AT[activeTab\ncurrent page]
    end

    subgraph Actions["Context Actions"]
        rP[registerPatient]
        rN[registerNgo]
        rV[registerVolunteer]
        lV[loginVolunteer]
        sP[submitPatientRequest]
        uI[updateNgoInventory]
        tA[toggleVolunteerAvailability]
        gM[getMatches]
    end

    rV -->|setUser volunteer| U
    rV -->|setNgos inventory++| N
    rV -->|setVolunteers| V
    tA -->|setVolunteers + setNgos ±1| V & N
    rP -->|setUser patient| U
    rN -->|setUser ngo + setNgos| U & N
    sP -->|setPatientRequests| PR
    gM --> N & V
```

---

## Socket.IO Event Architecture

```mermaid
sequenceDiagram
    participant C as React Client
    participant S as Dispatch Server

    Note over C,S: Registration Phase
    C->>S: register:donor { donorId, blood_group, pincode, lat, lng }
    C->>S: register:ngo { ngoId, inventory }
    C->>S: register:patient { requestId, patientId }

    Note over C,S: Dispatch Phase
    C->>S: autoMatch:start { request, donors[], ngos[] }
    S->>C: request:status { status: 'Searching' }
    S->>C: donor:incoming { requestId, bloodGroup, km, emergency }
    
    Note over C,S: Response Phase
    C->>S: donor:accept { requestId, donorId }
    S->>C: request:matched { contact: { name, phone } }
    S->>C: donor:confirmed { requestId }

    Note over C,S: Or — Decline
    C->>S: donor:reject { requestId, donorId }
    S->>C: request:status { status: 'Searching' }

    Note over C,S: Cancel
    C->>S: autoMatch:cancel { requestId }
    S->>C: donor:cancel { requestId }
```

---

## Pincode → Coordinates Resolution

```mermaid
flowchart LR
    A[Pincode input\ne.g. 700029] --> B{Exact match\nin PINCODE_DB?}
    B -->|Yes| C[Return exact lat/lng\ne.g. Alipore, Kolkata]
    B -->|No| D{First 3 digits\nexist in DB?}
    D -->|Yes| E[Return nearest match\nwith area override]
    D -->|No| F{Zone fallback\nby first digit}
    F -->|1 = Delhi\n4 = Mumbai\n5 = HYD etc| G[Return city-level coords]
    F -->|Unknown| H[Return India centroid\n20.59, 78.96]
```
