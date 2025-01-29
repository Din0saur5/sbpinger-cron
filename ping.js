const fetch = require("node-fetch");
require("dotenv").config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
};

// Function to send a POST request to the "pings" table
const sendPostRequest = async () => {
    const payload = { pinged: true };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/pings`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            console.log("POST request successful");
        } else {
            console.error("POST request failed:", await response.text());
        }
    } catch (error) {
        console.error("Error during POST request:", error);
    }
};

// Execute the POST request
sendPostRequest();
