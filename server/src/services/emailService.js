const nodemailer = require('nodemailer');
const { PrismaClient } = require('../db');
const dotenv = require('dotenv');

dotenv.config();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendAlertEmail(alert, reading) {
    const recipients = await prisma.recipient.findMany({ where: { isEnabled: true } });
    if (recipients.length === 0) return;
    const emailList = recipients.map(r => r.email).join(', ');
    const subject = `[ALERT] ${alert.type} on Device ${alert.deviceId}`;
    const text = `Alert: ${alert.message}\nReading: ${JSON.stringify(reading)}`;
    try {
        if (!process.env.SMTP_USER) { console.log('Email Simulation:', subject, text); }
        else { await transporter.sendMail({ from: process.env.FROM_EMAIL, to: emailList, subject, text }); }
    } catch (err) { console.error('Email failed', err); }
}

async function sendStatusReport() {
    const latest = await prisma.reading.findFirst({ orderBy: { ts: 'desc' } });
    if (!latest) return;
    console.log('Status Report Simulation:', JSON.stringify(latest));
}

module.exports = { sendAlertEmail, sendStatusReport };
