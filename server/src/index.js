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
const { initReplayService } = require('./services/replayService');
const { sendStatusReport } = require('./services/emailService');

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

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/readings', readingsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/replay', replayRouter);
app.use('/api/recommendation', recommendationRouter);

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
