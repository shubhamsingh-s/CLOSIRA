# Closira: AI-Powered Customer Communication Platform for SMBs

Welcome to the **Closira** internship project repository. This project consists of a production-quality backend service and a premium mobile dashboard app, built as a unified repository to showcase clean architecture, asynchronous task processing, state persistent schema designs, and visual mobile product design.

---

## Repository Structure

```text
/
├── backend/                  # FastAPI Backend Service
│   ├── app/
│   │   ├── api/              # Route Endpoints & Routers
│   │   ├── core/             # Configurations & JSON Logging Setup
│   │   ├── db/               # Database Engine & Connection Helper
│   │   ├── models/           # SQLAlchemy Data Entities
│   │   ├── schemas/          # Pydantic Validation Models
│   │   ├── services/         # Business Logic (SOP Matcher & Worker Tasks)
│   │   └── main.py           # FastAPI Entrypoint
│   ├── tests/                # Automated pytest Suite & .http Collection
│   ├── requirements.txt      # Python Dependencies
│   └── .env.example          # Environment Variables Template
│
├── frontend/                 # React Native Mobile App (Expo)
│   ├── src/
│   │   ├── components/       # Reusable UI Elements (Badges, Headers)
│   │   ├── screens/          # Dashboard, Leads, Escalations, Followups, Detail
│   │   ├── navigation/       # Stack & Bottom Tab Navigation Rules
│   │   ├── mock/             # High-Fidelity Mock JSON Payloads
│   │   └── theme/            # Styling Design Tokens (Color, Spacing, Typography)
│   ├── App.tsx               # Root React Native Entrypoint
│   ├── app.json              # Expo Configuration
│   ├── package.json          # Node Dependencies
│   └── tsconfig.json         # TypeScript Compiler Rules
│
└── README.md                 # Project Documentation (This File)
```

---

## Backend Architecture Decisions

### 1. Database Schema Design (Normalized SQLite)
We utilize a relational database architecture in SQLite using **SQLAlchemy** (declarative mapping) for database persistence. The schema is fully normalized into four key tables:
- **`enquiries`**: Persistent log of inbound customer queries. Tracks the customer's identity, communication channel (enum: whatsapp, email, call), original message, status (enum: new, qualified, escalated), and standard timestamps.
- **`sop_matches`**: Holds details when a query successfully triggers one of the defined Standard Operating Procedures (SOPs). Stored with a foreign key to the enquiry, label, auto-generated response, and the matched keywords (persisted as standard JSON arrays).
- **`followups`**: Persists scheduled follow-up alerts, capturing the delay intervals (in minutes), message templates, and scheduling metadata (`scheduled_for`, `status` [pending/executed]).
- **`events`**: Audit trail of the enquiry lifecycle. Every state transition (creation, background processing, keyword matches, manual escalations, or worker errors) is captured as a structured event row with JSON payloads.

**Database Schema Diagram (Conceptual):**
```text
  [enquiries] (1) ───┬─── (0..*) [sop_matches]
                     ├─── (0..*) [followups]
                     └─── (0..*) [events]
```

### 2. Async Task Processing: Celery vs. FastAPI BackgroundTasks
For this application, we chose **FastAPI's built-in `BackgroundTasks`** over Celery/Redis.
* **Justification**: Celery introduces heavy external dependencies (Redis or RabbitMQ as brokers, separate concurrency daemon workers, and result backends). While powerful for large-scale enterprise microservices, it overcomplicates local environment setups for internship evaluations.
* **Trade-off**: FastAPI's `BackgroundTasks` executes asynchronous tasks in a shared system thread pool. It satisfies Closira's non-blocking requirement (returning immediately to the caller with a `queued` state while executing processing offline) without requiring external broker installation.
* **Scalability Path**: If workloads scale significantly, we can transition this service to a task broker like Celery or a lightweight SQLite queue (e.g., RQ-SQLite) by swapping out the enqueue function in `app/api/endpoints.py` while keeping the service layer (`app/services/enquiry_service.py`) unchanged.

### 3. Structured JSON Logging
We implement structured logging instead of unstructured string writes:
* Logs are converted to a single-line JSON format containing automated fields (ISO 8601 timestamps, log level, module, function name) and custom context tags (like `event_type` and `extra_data` for tracking `enquiry_id` and matching keywords).
* Logs map to critical events requested: `enquiry_created`, `task_processed`, `sop_matched`, `followup_created`, `escalation_triggered`, and `errors`.

---

## Frontend Architecture Decisions

### 1. Styling Strategy: StyleSheet + Custom Theme.ts
We utilize standard React Native `StyleSheet` structured via a central design token file `frontend/src/theme/theme.ts` instead of TailwindCSS (NativeWind).
* **Justification**: React Native's `StyleSheet` runs natively on all platforms without Babel plugins or bundler overrides.
* **Polish & Theme**: By defining strict spacing scales (`Theme.spacing`), premium typography weights, and color tokens (Deep Navy background `#0F172A`, Slate cards, and high-contrast channel colors), we achieve a visually striking dashboard with rich aesthetics.

### 2. Navigation Architecture
The navigation utilizes **React Navigation** setup:
- **Bottom Tab Navigator**: Standard dashboard navigation containing four tabs: Home, Leads, Escalations, and Follow-ups.
- **Stack Navigator**: Wraps the tab bar and exposes a `ConversationDetail` route. When a user taps a lead, escalation, or follow-up card, the screen slides to reveal the full conversation thread, AI summary, SOP match outcomes, and chronological event timeline.

---

## Setup & Running Instructions

### Prerequisites
- **Python 3.10+** (tested on Python 3.14)
- **Node.js v18+** (tested on Node v24)
- **NPM v10+**

---

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration:
   ```bash
   copy .env.example .env
   # Or configure manually
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The API will spin up at `http://127.0.0.1:8000`
   * Open the interactive documentation at `http://127.0.0.1:8000/docs`

6. Run the unit tests:
   ```bash
   python -m pytest -v
   ```

---

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Expo dev server:
   ```bash
   npm run start
   ```
   * Press **`w`** to open in your web browser.
   * Or scan the QR code using the **Expo Go** mobile app on iOS/Android to run on a physical device.

---

## API Documentation

### 1. `POST /enquiry`
Create a new inbound enquiry.
* **Request Body:**
  ```json
  {
    "channel": "whatsapp",
    "customer_name": "Sarah M.",
    "message": "I was charged $50 instead of the $29 promotional plan! This is unacceptable."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
    "status": "queued",
    "message": "Enquiry received and queued for background processing"
  }
  ```

### 2. `POST /enquiry/{id}/followup`
Schedule a follow-up reminder.
* **Request Body:**
  ```json
  {
    "delay_in_minutes": 30,
    "message_template": "Hi {{customer_name}}, just checking back on your pricing query."
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "e67ff8df-dbde-4467-96a8-27e1f40d850a",
    "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
    "delay_in_minutes": 30,
    "message_template": "Hi {{customer_name}}, just checking back on your pricing query.",
    "status": "pending",
    "scheduled_for": "2026-05-23T08:24:16.892Z",
    "created_at": "2026-05-23T07:54:16.892Z"
  }
  ```

### 3. `POST /enquiry/{id}/escalate`
Force manual escalation to human agents.
* **Request Body:**
  ```json
  {
    "reason": "Customer remains unhappy after billing adjustment."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "4b277d34-706f-40e9-b5fe-f4728562d552",
    "customer_name": "Sarah M.",
    "channel": "whatsapp",
    "message": "I was charged $50 instead of the $29 promotional plan! This is unacceptable.",
    "status": "escalated",
    "created_at": "2026-05-23T07:50:00.000Z",
    "updated_at": "2026-05-23T07:54:30.000Z"
  }
  ```

### 4. `GET /enquiry/{id}/history`
Fetch full conversation log, matched SOP labels, follow-ups, and the chronological timeline.
* **Response (200 OK):**
  ```json
  {
    "enquiry": {
      "id": "4b277d34-706f-40e9-b5fe-f4728562d552",
      "customer_name": "Sarah M.",
      "channel": "whatsapp",
      "message": "I was charged $50 instead of the $29 promotional plan! This is unacceptable.",
      "status": "escalated",
      "created_at": "2026-05-23T07:50:00.000Z",
      "updated_at": "2026-05-23T07:54:30.000Z"
    },
    "sop_matches": [
      {
        "id": "sop_m_001",
        "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
        "sop_label": "Complaint Handling",
        "suggested_response": "We apologize for the inconvenience...",
        "matched_keywords": ["unacceptable"],
        "created_at": "2026-05-23T07:51:00.000Z"
      }
    ],
    "followups": [],
    "events": [
      {
        "id": "evt_1",
        "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
        "event_type": "enquiry_created",
        "payload": { "channel": "whatsapp", "customer_name": "Sarah M." },
        "created_at": "2026-05-23T07:50:00.000Z"
      },
      {
        "id": "evt_2",
        "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
        "event_type": "sop_matched",
        "payload": { "sop_label": "Complaint Handling", "matched_keywords": ["unacceptable"] },
        "created_at": "2026-05-23T07:51:00.000Z"
      },
      {
        "id": "evt_3",
        "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
        "event_type": "task_processed",
        "payload": { "processed_at": "2026-05-23T07:51:02.000Z" },
        "created_at": "2026-05-23T07:51:02.000Z"
      },
      {
        "id": "evt_4",
        "enquiry_id": "4b277d34-706f-40e9-b5fe-f4728562d552",
        "event_type": "escalation_triggered",
        "payload": { "reason": "Customer remains unhappy after billing adjustment." },
        "created_at": "2026-05-23T07:54:30.000Z"
      }
    ]
  }
  ```

---

## Known Trade-offs & Limitations

1. **FastAPI Background Concurrency**: The background thread pool uses simple memory scheduling. If the main server crashes, queued tasks that haven't run are lost. In production environments, Celery or an external persistent queue (like Redis Queue) is recommended.
2. **SOP Keyword Logic**: We use basic word boundary checking for matching. In a full production build, this would be backed by a semantic NLP model (e.g. BERT or GPT API embeddings) to evaluate semantic similarity of inbound requests.
3. **No Direct Frontend-Backend Link**: The mobile dashboard runs entirely on static JSON mocks. This makes it instantly runnable on web browsers and phone simulators without needing CORS setups, port forwarding, or local sqlite access configurations on the simulator.

---

## Future Improvements
- **Live WebSocket Synchronizer**: Stream state changes in real-time from the backend worker directly to the frontend dashboard.
- **Enhanced NLP Search**: Move keyword searching to a vector-db based semantic match.
- **Follow-up Cron Job**: Run a background thread to automatically execute follow-up reminders when their `scheduled_for` timestamp is reached.
