# BloodLink — System Overview

## What Is BloodLink?

BloodLink is an intelligent blood donation coordination platform that connects **patients** who urgently need blood with **NGOs** that store blood inventory and **volunteers** who can donate. It operates like "Uber for blood" — using real-time dispatch, pincode-based proximity matching, and a live notification system.

---

## System Actors

| Actor | Role | Entry Point |
|---|---|---|
| **Patient** | Registers a blood request — fills name, hospital, blood group, pincode, urgency | Patient Portal |
| **NGO Admin** | Registers their blood bank, manages inventory and volunteer database | NGO Portal |
| **Volunteer** | Registers under an NGO, receives and accepts/rejects blood requests | Volunteer Portal |
| **System (AI Engine)** | Ranks and dispatches donors based on proximity, blood compatibility, and availability | AppContext + Dispatch Server |

---

## Two Core Matching Modes

### 1. Manual Search (existing)
- Patient fills form → System shows ranked NGOs and their volunteers
- Patient manually contacts NGO or notifies a specific volunteer
- No real-time server needed

### 2. Automatic Match (Uber-style)
- Patient fills form → switches to "Automatic Match" → submits
- Dispatch server ranks all donors by score and contacts them one by one
- Each donor has **2 minutes** to Accept or Decline
- On acceptance → patient sees donor's contact details in real time
- On decline or timeout → next donor in queue is tried automatically

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend UI | React 19 + React Router 7 |
| Bundler | Vite 8 |
| State Management | React Context API (AppContext) |
| Icons | lucide-react |
| Real-time Communication | Socket.IO (client + server) |
| Backend Dispatch Server | Node.js + Express + Socket.IO |
| Geolocation | Custom PINCODE_DB + Haversine formula |
| Data Persistence | In-memory (client-side React state + server Maps) |
| CSS | Vanilla CSS with custom design tokens |

---

## Key Design Decisions

1. **Pincode-first matching** — No GPS needed. Pincodes map to lat/lng coordinates via PINCODE_DB.
2. **Compatibility-aware** — Blood group matching follows standard medical donation rules.
3. **Non-destructive integration** — Automatic dispatch added as a layer. Manual features unchanged.
4. **Zero-data start** — All NGOs, volunteers, and inventory must be added by real users.
5. **In-memory server DB** — Simulates tables. Resets on server restart (production uses MongoDB/PostgreSQL).

---

## Deployment Architecture

```
Browser (React SPA)
    |
    |-- HTTP (port 5173)  -->  Vite Dev Server --> React Frontend
    |
    +-- WebSocket + HTTP (port 3001) --> BloodLink Dispatch Server
                                              |-- Express REST API
                                              +-- Socket.IO Real-Time
```
