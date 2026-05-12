const nodemailer = require('nodemailer');
const { PrismaClient } = require('../db');
const dotenv = require('dotenv');

dotenv.config();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : undefined
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendMail(to, subject, html) {
    if (!process.env.SMTP_USER) {
        console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from: `"Soil Health Intelligence" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
}

async function sendWelcomeEmail(user) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h1 style="color:#10b981;">🌱 Welcome to Soil Health Intelligence!</h1>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your account has been created successfully. You can now monitor your soil health in real-time from anywhere.</p>
      <p style="margin-top:24px;padding:16px;background:#1e293b;border-radius:8px;border-left:4px solid #10b981;">
        <strong>Account:</strong> ${user.email}
      </p>
      <p style="margin-top:24px;color:#94a3b8;font-size:13px;">If you didn't create this account, please ignore this email.</p>
    </div>`;
    await sendMail(user.email, '🌱 Welcome to Soil Health Intelligence!', html);
    console.log(`Welcome email sent to ${user.email}`);
}

async function sendCriticalMoistureAlert(moistureRaw) {
    // Send to ALL registered users
    const users = await prisma.user.findMany();
    if (users.length === 0) return;

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h1 style="color:#ef4444;">🚨 Critical Soil Moisture Alert!</h1>
      <p>Your soil monitoring system has detected a <strong>critically low moisture level</strong>.</p>
      <div style="margin:24px 0;padding:20px;background:#1e293b;border-radius:8px;border-left:4px solid #ef4444;text-align:center;">
        <div style="font-size:14px;color:#94a3b8;">Raw Sensor Reading</div>
        <div style="font-size:48px;font-weight:bold;color:#ef4444;">${moistureRaw}</div>
        <div style="font-size:13px;color:#94a3b8;">out of 4095 (Very Dry — Above 3000 threshold)</div>
      </div>
      <p>⚠️ <strong>Immediate irrigation is recommended</strong> to prevent crop stress.</p>
      <p style="margin-top:24px;color:#94a3b8;font-size:13px;">This is an automated alert from your Soil Health Intelligence system.</p>
    </div>`;

    for (const user of users) {
        await sendMail(user.email, '🚨 CRITICAL: Soil Moisture Alert - Immediate Action Required!', html);
        console.log(`Critical alert sent to ${user.email}`);
    }
}

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

module.exports = { sendAlertEmail, sendStatusReport, sendWelcomeEmail, sendCriticalMoistureAlert };
