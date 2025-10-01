const fetch = require("node-fetch");
require("dotenv").config();

function loadProjectsFromEnv() {
  const raw = process.env.SUPABASES_JSON;
  if (!raw) throw new Error("Missing SUPABASES_JSON env var.");

  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    throw new Error("SUPABASES_JSON is not valid JSON: " + e.message);
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("SUPABASES_JSON must be a non-empty JSON array.");
  }

  // Basic schema check + cleanup
  const projects = arr
    .map((x, i) => ({
      id: `env-${i + 1}`,
      url: typeof x.url === "string" ? x.url.trim().replace(/\/+$/, "") : "",
      key: typeof x.key === "string" ? x.key : "",
    }))
    .filter(p => p.url && p.key);

  if (projects.length === 0) {
    throw new Error("No valid {url,key} entries found in SUPABASES_JSON.");
  }

  return projects;
}

async function pingDatabase(db) {
  const headers = {
    "Content-Type": "application/json",
    apikey: db.key,
    Authorization: `Bearer ${db.key}`,
  };

  const payload = { pinged: true, at: new Date().toISOString() };

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
})();
