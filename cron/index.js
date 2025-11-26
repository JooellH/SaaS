const axios = require("axios");
require("dotenv").config();

// Nest backend is mounted with global prefix /api; normalize to avoid missing prefix.
const rawBackendUrl =
  process.env.CRON_BACKEND_URL || "http://localhost:3000/api";
const BACKEND_URL = rawBackendUrl.replace(/\/$/, "");

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
