const express = require('express');
const { PrismaClient } = require('../db');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const alerts = await prisma.alert.findMany({ orderBy: { ts: 'desc' } });
    res.json(alerts);
});

router.post('/:id/ack', async (req, res) => {
    const alert = await prisma.alert.update({
        where: { id: parseInt(req.params.id) },
        data: { acknowledged: true }
    });
    res.json(alert);
});

module.exports = router;
