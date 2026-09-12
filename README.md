# LABES

Live AI-Based Equipment Safety

LABES is an AI-powered industrial monitoring platform that combines Machine Health monitoring and Worker Safety intelligence in one unified system.

## Platform Management

### Environment

Required backend variables:

```bash
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/labes
JWT_SECRET=change-this-development-secret
JWT_EXPIRES_IN=7d
```

Frontend:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

### Authentication And Authorization

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

JWT tokens identify the user and role. Admin-only APIs are protected by `requireAuth` and `requireAdmin`.

Roles:

- `ADMIN`
- `OPERATOR`
- `VIEWER`

### User Management

Admin-only endpoints:

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

Passwords are hashed with bcrypt and never returned by APIs.

### Machine Management

Machine identity and thresholds are stored in MongoDB.

- `GET /api/machines`
- `GET /api/machines/:id`
- `POST /api/machines` admin only
- `PATCH /api/machines/:id` admin only
- `DELETE /api/machines/:id` admin only

Threshold schema:

```json
{
  "vibrationRms": { "warning": 4.5, "critical": 7.1 },
  "peakAcceleration": { "warning": 2.0, "critical": 4.0 },
  "temperature": { "warning": 70, "critical": 85 },
  "current": { "warning": 8, "critical": 10 },
  "anomalyScore": { "warning": 0.7, "critical": 0.9 }
}
```

Backend validation enforces warning/critical ordering and anomaly score range.

Smart industrial monitoring application for machine reliability and worker safety.

## Machine Health

Machine Health is the predictive maintenance module. It accepts IoT-style telemetry, extracts vibration features, sends those features to an isolated AI prediction service, persists the resulting health record, and exposes the data to the React dashboard.

### Architecture

- `backend/models/Machine.js`: machine identity, zone, status, and last-seen timestamp.
- `backend/models/HealthRecord.js`: processed sensor values, RMS, peak, FFT bands, health score, and AI status.
- `backend/services/featureExtractionService.js`: pure signal-processing helpers for RMS, peak, FFT spectrum, and FFT bands.
- `backend/services/aiMachineHealthService.js`: mock AI predictor with configurable thresholds.
- `backend/services/machineHealthService.js`: orchestration flow for validation, feature extraction, AI prediction, persistence, and retrieval.
- `backend/routes/machineHealthRoutes.js`: REST API mounted under `/api/machines`.
- `Frontend/src/pages/MachineHealth.tsx`: Machine Health UI using the existing Layout, Navbar, colors, cards, and spacing.
- `Frontend/src/services/machineHealthApi.ts`: frontend API client.

### MQTT Payload Contract

Future MQTT messages are expected on topics such as `machine/node1`, `machine/node2`, and `machine/node3`.

```json
{
  "timestamp": 1717000000,
  "vibration": [0.02, -0.01, 0.98, 0.03],
  "temperature": 41.2,
  "current": 0.85
}
```

The backend also accepts optional `machineId`, `name`, and `zone` fields to support multiple machines.

### MongoDB Collections

- `machines`: `machineId`, `name`, `zone`, `status`, `lastSeen`, `createdAt`, `updatedAt`.
- `healthrecords`: `machineId`, `timestamp`, `temperature`, `current`, `rms`, `peak`, `fftBands`, `vibrationPreview`, `healthScore`, `status`.

Indexes are defined for machine lookup and health history queries by `machineId` and `timestamp`.

### AI Contract

Input:

```json
{
  "rms": 1.42,
  "peak": 3.87,
  "fft_bands": [0.12, 0.08]
}
```

Output:

```json
{
  "health_score": 87,
  "status": "green"
}
```

Default status thresholds:

- `green`: score >= `80`
- `yellow`: score >= `50`
- `red`: score < `50`

Thresholds are configurable with `MACHINE_HEALTH_GREEN_THRESHOLD` and `MACHINE_HEALTH_YELLOW_THRESHOLD`.

### REST Endpoints

- `GET /api/machines`: list machines.
- `GET /api/machines/:id`: get machine information.
- `GET /api/machines/:id/health`: get latest health record.
- `GET /api/machines/:id/history?from=&to=&limit=`: get health score history.
- `GET /api/machines/:id/metrics`: get dashboard-ready machine metrics.
- `POST /api/machines/simulate`: generate simulated `HEALTHY`, `WARNING`, or `CRITICAL` telemetry.

Example simulation:

```bash
curl -X POST http://localhost:5000/api/machines/simulate \
  -H "Content-Type: application/json" \
  -d "{\"scenario\":\"HEALTHY\",\"machineId\":\"machine-01\"}"
```

### Run Locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Open the frontend and navigate to `#machines`.

### Test

Backend tests:

```bash
cd backend
npm test
```

Frontend build:

```bash
cd Frontend
npm run build
```
