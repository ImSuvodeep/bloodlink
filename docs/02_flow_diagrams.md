# BloodLink — User Flow Diagrams

## 1. Patient Registration & Manual Match Flow

```mermaid
flowchart TD
    A([Patient Opens Site]) --> B[Click 'Patient Portal']
    B --> C{New or Returning?}
    C -->|New| D[Step 1: Personal Info\nName · Phone · Email · Gender]
    D --> E[Step 2: Medical Details\nBlood Group · Hospital · City · Pincode · Urgency]
    E --> F[Step 3: Prescription\nDoctor · Prescription ID · Notes]
    F --> G{Select Mode}
    G -->|Manual Search| H[Submit Request\nSystem runs matching engine]
    H --> I[View Ranked NGO List\nSorted by: proximity + blood availability]
    I --> J{Patient Action}
    J -->|Contact NGO| K[📞 Call NGO directly]
    J -->|See Volunteers| L[Expand volunteer list under NGO]
    L --> M{Volunteer Action}
    M -->|Notify| N[In-app notification sent to volunteer dashboard]
    M -->|Call| O[📞 Call volunteer directly]
    K & N & O --> P([Request Resolved / Call Made])
```

---

## 2. Automatic Match Dispatch Flow

```mermaid
flowchart TD
    A([Patient selects Automatic Mode]) --> B[Fill 3-step Form]
    B --> C[Submit Form]
    C --> D[System saves to BloodRequests table]
    D --> E[Click: Start Automatic Match]
    E --> F[Frontend sends autoMatch:start to Socket server]
    F --> G[Server: rankCandidates\nScore all donors + NGOs]
    G --> H[Build donor_queue ordered by score]
    H --> I[Status: Searching...]
    I --> J[Dispatch to Queue[0] — nearest donor]
    J --> K[donor:incoming event sent to donor's device]
    K --> L{Donor responds within 2 min?}
    L -->|Accept| M[donor:accept event]
    L -->|Decline| N[donor:reject event]
    L -->|Timeout (2min)| N
    M --> O[Server: lockDonor for 30 min]
    O --> P[Status: Accepted]
    P --> Q[request:matched sent to patient]
    Q --> R([Patient sees donor Name + Phone + Call Now button])
    N --> S{More donors in queue?}
    S -->|Yes| T[Status: Searching...\nDispatch to Queue[index+1]]
    T --> J
    S -->|No| U[Status: Rejected\nNo donors available]
    U --> V([Patient directed to Manual Search / direct NGO contact])
```

---

## 3. NGO Registration & Dashboard Flow

```mermaid
flowchart TD
    A([NGO Admin visits site]) --> B[Click 'NGO Portal']
    B --> C{Already registered?}
    C -->|Yes| D[Enter NGO Name or ID to login]
    C -->|No| E[Fill Registration Form\nName · Phone · City · Pincode · Reg No]
    E --> F[System auto-verifies NGO]
    F --> G[Redirect to NGO Dashboard]
    D --> G
    G --> H{Dashboard Tab}
    H -->|Blood Inventory| I[Adjust stored blood units per group\nVolunteer auto-sync shown below]
    H -->|Volunteers| J[View all registered volunteers\nToggle availability · Add manually]
    H -->|Requests| K[See Auto-Match requests in real-time\nAND manual patient submissions]
    J --> L{NGO Management}
    L -->|Add Volunteer| M[Fill volunteer form → inventory auto-updates]
    L -->|Toggle Availability| N[Inventory count +1 or -1 for blood group]
    K --> O[Live Socket updates for dispatch status]
```

---

## 4. Volunteer Lifecycle Flow

```mermaid
flowchart TD
    A([New Volunteer]) --> B[Volunteer Portal → Register tab]
    B --> C[Fill Step 1: Name · Phone · Blood Group · Pincode]
    C --> D[Fill Step 2: Choose NGO · Agree Terms]
    D --> E[System registers volunteer]
    E --> F[Auto-logged in as Volunteer]
    E --> G[NGO inventory auto-updates: +1 for blood group]
    F --> H[Volunteer Dashboard]
    H --> I{Set Availability}
    I -->|ON| J[Available for requests\nInventory +1]
    I -->|OFF| K[Offline\nInventory -1]
    H --> L[See incoming patient requests\nmatching blood group]
    L --> M{Manual Request Action}
    M -->|Accept| N[Notification: Confirmed to patient]
    M -->|Decline| O[Request removed from their list]
    H --> P[See Auto-Match dispatch pop-up\n2-minute countdown]
    P --> Q{Socket Request Action}
    Q -->|Accept| R[donor:accept → server locks donor\nPatient gets contact details]
    Q -->|Decline| S[donor:reject → next donor tried]
    Q -->|Timeout| S
    A2([Returning Volunteer]) --> B2[Volunteer Portal → Login tab]
    B2 --> C2[Enter registered phone number]
    C2 --> F
```

---

## 5. Blood Inventory Sync Flow

```mermaid
flowchart LR
    A[Volunteer Registers\nBlood: A+] -->|+1| B[(NGO Inventory\nA+: count++)]
    C[Volunteer Toggles OFF\nBlood: A+] -->|-1| B
    D[Volunteer Toggles ON\nBlood: A+] -->|+1| B
    E[NGO Adds Volunteer\nManually Blood: B+] -->|+1| F[(NGO Inventory\nB+: count++)]
    G[NGO Manual Edit\nIn Inventory Tab] --> H[(NGO Inventory\nDirect override)]
    B & F & H --> I{Matching Engine}
    I --> J[Patients see\nreal-time blood availability]
```
