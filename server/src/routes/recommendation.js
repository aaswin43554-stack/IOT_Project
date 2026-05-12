const express = require('express');
const { PrismaClient } = require('../db');
const { getCropRecommendation } = require('../services/recommendationService');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/latest', async (req, res) => {
    const reading = await prisma.reading.findFirst({ orderBy: { ts: 'desc' } });
    if (!reading) return res.status(404).json({ error: 'No reading' });
    const rec = getCropRecommendation(
        reading.ph,
        reading.ecDsM,
        reading.soilMoisturePct,
        reading.nitrogen,
        reading.phosphorus,
        reading.potassium
    );
    res.json(rec);
});

module.exports = router;
