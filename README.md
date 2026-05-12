# Soil Information Monitoring System

A software-only monorepo for monitoring soil data using a Kaggle dataset.

## Features
- **Real-time Replay**: Replays historical sensor data as a live IoT stream using Socket.IO.
- **Dynamic Alerts**: Triggers alerts for dry soil, overwet soil, and pH out of range.
- **Analytics Dashboard**: Interactive charts and live status cards.
- **Acknowledgement Flow**: Track and acknowledge alerts from the dashboard.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Dataset Placement
Download the Kaggle dataset: **"Dataset Soil pH, Soil Moisture and Temperature"**.
Place the file (CSV or XLSX) in the `/data` directory and name it `soil_dataset.csv` or `soil_dataset.xlsx`.
*A sample CSV is already provided for testing.*

### 3. Installation
Run the following command from the root directory to install all dependencies:
```bash
npm run install:all
```

### 4. Data Ingestion
Load the dataset into the SQLite database:
```bash
npm run ingest
```
*Note: If the ingestion script faces TypeScript resolution issues, you can run `node server/scripts/ingest.js`.*

### 5. Running the Application
Start both the server and the web dashboard concurrently:
```bash
npm run dev
```

The application will be available at:
- **Dashboard**: `http://localhost:5173`
- **Server API**: `http://localhost:3001`

## API Endpoints
- `GET /api/readings/latest`: Get current sensor status.
- `GET /api/readings/range`: Get historical data.
- `GET /api/alerts`: List all alerts.
- `POST /api/alerts/:id/ack`: Acknowledge an alert.
- `POST /api/replay/start | pause | reset`: Control the real-time stream.
