const express = require('express');
const { PrismaClient } = require('../db');
const { checkAlertsV2 } = require('../services/replayService');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/latest', async (req, res) => {
    const reading = await prisma.reading.findFirst({ orderBy: { ts: 'desc' } });
    res.json(reading);
});

router.get('/range', async (req, res) => {
    const readings = await prisma.reading.findMany({ orderBy: { ts: 'asc' } });
    res.json(readings);
});

router.post('/', async (req, res) => {
    const { deviceId, soilMoisturePct, soilTempC, airTempC, humidityPct, ph, ecDsM, nitrogen, phosphorus, potassium } = req.body;
    const reading = await prisma.reading.create({
        data: {
            deviceId, ts: new Date(), soilMoisturePct, soilTempC, airTempC, humidityPct, ph, ecDsM, nitrogen, phosphorus, potassium
        }
    });
    const { io } = require('../index');
    if (io) {
        io.emit('reading', reading);
        await checkAlertsV2(reading, io);
    }
    res.json(reading);
});

module.exports = router;
