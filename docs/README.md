# BloodLink Documentation Index

An intelligent, real-time blood donation coordination platform.

---

## Documents

| # | File | Contents |
|---|---|---|
| 1 | [01_system_overview.md](./01_system_overview.md) | Actors, matching modes, tech stack, design decisions |
| 2 | [02_flow_diagrams.md](./02_flow_diagrams.md) | Patient, NGO, Volunteer, Auto-Match, Inventory sync flowcharts |
| 3 | [03_dfd.md](./03_dfd.md) | DFD Level 0, Level 1, Level 2 for all core processes |
| 4 | [04_architecture.md](./04_architecture.md) | Component graph, file map, state model, Socket.IO sequence diagram |
| 5 | [05_matching_algorithm.md](./05_matching_algorithm.md) | Scoring formula, blood compatibility, Haversine, dispatch queue, worked example |
| 6 | [06_database_schema.md](./06_database_schema.md) | In-memory structures, SQL schema, MongoDB schema, ERD |
| 7 | [07_api_reference.md](./07_api_reference.md) | REST endpoints + all Socket.IO events (client→server and server→client) |
| 8 | [08_security.md](./08_security.md) | Sensitive data inventory, vulnerabilities, production hardening, DPDP compliance |

---

## Quick Reference

### Run the project
```bash
npm run dev:full      # Starts both Vite (frontend) + Dispatch server (port 3001)
npm run dev           # Frontend only (no auto-match)
npm run server        # Dispatch server only
npm run build         # Production build
```

### Key URLs
```
Frontend:         http://localhost:5173
Dispatch server:  http://localhost:3001
Health check:     http://localhost:3001/api/health
Active requests:  http://localhost:3001/api/requests
```

### Request Status Lifecycle
```
Pending → Searching → Requested → Accepted
                  ↘           ↘
                Rejected    Cancelled
```

### Scoring Formula
```
score = (exactBloodMatch ? 100 : 0)
      + (isAvailable ? 50 : SKIP)
      + (hasNGOStock ? 40 : SKIP)
      + (isCritical ? 30 : 0)
      − (distanceKm × 5)
```
