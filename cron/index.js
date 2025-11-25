const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function sendReminders() {
    console.log(`[${new Date().toISOString()}] Starting reminder cron job`);

    try {
        const response = await axios.post(`${BACKEND_URL}/cron/send-reminders`);
        console.log(`[${new Date().toISOString()}] Success:`, response.data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        process.exit(1);
    }
}

sendReminders();
