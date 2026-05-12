const { PrismaClient } = require('../db');
const { sendAlertEmail } = require('./emailService');

const prisma = new PrismaClient();

let timer = null;
let currentIndex = 0;
let isPlaying = false;
let speed = 2000;
let lastAlertSent = {};

async function initReplayService(io) {
}

async function checkAlertsV2(reading, io) {
    const { deviceId, airTempC, humidityPct, ph, ecDsM } = reading;
    const now = Date.now();

    const rules = [
        { condition: airTempC > 40, type: 'TEMP_CRITICAL', severity: 'high', message: `Critical air temp: ${airTempC.toFixed(1)}C` },
        { condition: humidityPct < 30, type: 'HUMIDITY_LOW', severity: 'medium', message: `Low humidity: ${humidityPct.toFixed(1)}%` },
        { condition: humidityPct > 80, type: 'HUMIDITY_HIGH', severity: 'medium', message: `High humidity: ${humidityPct.toFixed(1)}%` },
        { condition: ph < 5.5 || ph > 7.5, type: 'PH_OUT_OF_RANGE', severity: 'medium', message: `pH out of range: ${ph.toFixed(1)}` },
        { condition: ecDsM > 2.0, type: 'EC_HIGH', severity: 'high', message: `High salinity (EC): ${ecDsM.toFixed(1)} dS/m` }
    ];

    for (const rule of rules) {
        if (rule.condition) {
            const alertKey = `${deviceId}-${rule.type}`;
            const lastSentTime = lastAlertSent[alertKey] || 0;
            const shouldEmail = (now - lastSentTime > 1800000);

            const alert = await prisma.alert.create({
                data: { deviceId, ts: new Date(), type: rule.type, severity: rule.severity, message: rule.message, lastSentAt: shouldEmail ? new Date() : null }
            });

            if (shouldEmail) {
                lastAlertSent[alertKey] = now;
                await sendAlertEmail(alert, reading);
            }
            io.emit('alert', alert);
        }
    }
}

async function startReplay(io) {
    if (isPlaying) return;
    isPlaying = true;
    const readings = await prisma.reading.findMany({ orderBy: { ts: 'asc' } });
    if (readings.length === 0) { isPlaying = false; return; }
    const run = async () => {
        if (!isPlaying) return;
        const reading = readings[currentIndex];
        io.emit('reading', reading);
        await checkAlertsV2(reading, io);
        currentIndex = (currentIndex + 1) % readings.length;
        timer = setTimeout(run, speed);
    };
    run();
}

function pauseReplay() { isPlaying = false; if (timer) clearTimeout(timer); }
function resetReplay() { currentIndex = 0; lastAlertSent = {}; }
function setSpeed(newSpeed) { speed = newSpeed; }
function getStatus() { return { isPlaying, currentIndex, speed }; }

module.exports = { initReplayService, startReplay, pauseReplay, resetReplay, setSpeed, getStatus, checkAlertsV2 };
