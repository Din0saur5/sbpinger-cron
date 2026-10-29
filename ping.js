const fetch = require("node-fetch");
require("dotenv").config();
const { loadProjectsFromEnv } = require("./config");

async function pingDatabase(db) {
  const headers = {
    "Content-Type": "application/json",
    apikey: db.key,
  };

  // Publishable/secret keys are not JWTs. Only legacy JWT keys belong in
  // Authorization; sending an sb_* key there causes an Invalid JWT error.
  if (!db.key.startsWith("sb_publishable_") && !db.key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${db.key}`;
  }

  const payload = { pinged: true, created_at: new Date().toISOString() };

  try {
    const res = await fetch(`${db.url}/rest/v1/pings`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`✅ ${db.id} (${db.url}) -> OK`);
    } else {
      console.error(`❌ ${db.id} (${db.url}) ->`, await res.text());
    }
  } catch (err) {
    console.error(`🚨 ${db.id} (${db.url}) error ->`, err.message);
  }
}

(async () => {
  const projects = loadProjectsFromEnv();
  console.log(`Pinging ${projects.length} Supabase project(s)...`);

  // Sequential (easier on rate limits)
  for (const db of projects) {
    await pingDatabase(db);
  }

  // If you prefer parallel:
  // await Promise.all(projects.map(pingDatabase));

  console.log("Done.");
})().catch((error) => {
  console.error(`Pinger failed: ${error.message}`);
  process.exitCode = 1;
});
