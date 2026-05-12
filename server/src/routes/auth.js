const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../db');
const { sendWelcomeEmail } = require('../services/emailService');
const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashed }
        });
        // Send welcome email (non-blocking)
        sendWelcomeEmail(user).catch(err => console.error('Welcome email failed:', err));
        return res.status(201).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Server error during signup' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        return res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
