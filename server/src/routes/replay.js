const express = require('express');
const { startReplay, pauseReplay, resetReplay, setSpeed, getStatus } = require('../services/replayService');
const router = express.Router();

router.get('/status', (req, res) => { res.json(getStatus()); });
router.post('/start', async (req, res) => {
    const { io } = require('../index');
    if (io) await startReplay(io);
    res.json({ message: 'Started' });
});
router.post('/pause', (req, res) => { pauseReplay(); res.json({ message: 'Paused' }); });
router.post('/reset', (req, res) => { resetReplay(); res.json({ message: 'Reset' }); });
router.post('/speed', (req, res) => { setSpeed(req.body.speed); res.json({ message: 'Speed set' }); });

module.exports = router;
