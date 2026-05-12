const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { PrismaClient } = require('./db');

const readingsRouter = require('./routes/readings');
const alertsRouter = require('./routes/alerts');
const replayRouter = require('./routes/replay');
const recommendationRouter = require('./routes/recommendation');
const authRouter = require('./routes/auth');
const { initReplayService } = require('./services/replayService');
const { sendStatusReport, sendCriticalMoistureAlert } = require('./services/emailService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/readings', readingsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/replay', replayRouter);
app.use('/api/recommendation', recommendationRouter);
app.use('/api/auth', authRouter);

app.post('/api/sensor', (req, res) => {
    const { moisture, temperature, humidity } = req.body;
    if (moisture !== undefined) {
        const raw = Number(moisture);
        console.log(`Received from ESP32 → Moisture: ${raw}, Temp: ${temperature}°C, Humidity: ${humidity}%`);
        io.emit('sensorData', { moisture: raw, temperature, humidity });

        // Send critical alert email if moisture goes above 300
        // Adding a 30-minute cooldown so we don't spam the user's inbox every 5 seconds
        if (raw >= 300) {
            const now = Date.now();
            const lastAlertTime = global.lastMoistureAlertTime || 0;
            if (now - lastAlertTime > 30 * 60 * 1000) { // 30 minutes
                console.log('CRITICAL moisture detected (>300)! Sending alert emails...');
                sendCriticalMoistureAlert(raw).catch(err => console.error('Alert email failed:', err));
                global.lastMoistureAlertTime = now;
            }
        }

        res.status(200).json({ success: true, message: 'Data received and broadcasted' });
    } else {
        res.status(400).json({ success: false, message: 'Missing moisture value' });
    }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../../web/dist')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../web/dist/index.html'));
});


// Socket.IO
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});

// Initialize Services
initReplayService(io);

// Default Recipient Seed
async function seedRecipient() {
    const count = await prisma.recipient.count();
    if (count === 0) {
        await prisma.recipient.create({
            data: { email: 'aaswin43554@gmail.com', isEnabled: true }
        });
        console.log('Default recipient seeded: aaswin43554@gmail.com');
    }
}
seedRecipient();

// Cron: Every 6 hours status report
cron.schedule('0 */6 * * *', () => {
    console.log('Running 6-hour status report cron...');
    sendStatusReport();
});

server.listen(port, () => {
    console.log(`Server V2 (CommonJS) running on port ${port}`);
});

module.exports = { io, prisma };
