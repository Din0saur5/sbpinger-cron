const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");
const { loadProjectsFromEnv } = require("./config");

const validProject = { url: "https://example.supabase.co", key: "sb_publishable_test" };
const load = (value) => loadProjectsFromEnv({ SUPABASES_JSON: JSON.stringify(value) });

test("accepts modern and legacy keys, normalizes base URLs, and accepts JSON whitespace", () => {
  const projects = loadProjectsFromEnv({ SUPABASES_JSON: JSON.stringify([
    { ...validProject, url: " https://example.supabase.co/// " },
    { url: "http://127.0.0.1:54321/", key: "legacy.jwt.key" },
    { ...validProject, key: "sb_secret_test" },
  ], null, 2) });
  assert.equal(projects.length, 3);
  assert.equal(projects[0].url, validProject.url);
  assert.equal(projects[1].url, "http://127.0.0.1:54321");
  assert.deepEqual(projects.map(project => project.id), ["env-1", "env-2", "env-3"]);
});

test("rejects missing, malformed, empty, and non-array configuration", () => {
  for (const raw of [undefined, "", " ", "not JSON", "[{},]", "null", "{}", "[]"]) {
    assert.throws(() => loadProjectsFromEnv({ SUPABASES_JSON: raw }), /SUPABASES_JSON/);
  }
});

test("rejects every invalid entry instead of silently dropping it", () => {
  for (const project of [null, [], "value", {}, { ...validProject, url: 1 },
    { ...validProject, key: 1 }, { ...validProject, key: "" },
    { ...validProject, key: " " }, { ...validProject, key: "key with spaces" },
    { ...validProject, key: "key\n" }, { ...validProject, key: "key\u0000" },
    { ...validProject, key: "key\u2603" }]) {
    assert.throws(() => load([validProject, project]), /entry 2/);
  }
});

test("rejects invalid URLs, non-HTTP protocols, credentials, and endpoint paths", () => {
  for (const url of ["", "not-a-url", "example.supabase.co", "ftp://example.com",
    "https://user:password@example.com", "https://example.com/rest/v1/pings",
    "https://example.com?key=secret", "https://example.com#fragment",
    "https://example.com?", "https://example.com#", "https:example.com",
    "https://exa\nmple.com"]) {
    assert.throws(() => load([{ ...validProject, url }]), /entry 1.*url/);
  }
});

function run(script, raw) {
  return spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: __dirname,
    env: { ...process.env, SUPABASES_JSON: raw },
    encoding: "utf8",
    timeout: 5000,
  });
}

test("validator exits successfully without contacting the configured host", () => {
  const result = run("validate-env.js", JSON.stringify([
    { url: "https://does-not-exist.invalid", key: "sb_publishable_test" },
  ]));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /validation passed: 1 project/);
});

test("validator and runtime fail clearly without leaking keys from malformed JSON", () => {
  const secret = "do-not-log-this-api-key";
  for (const script of ["validate-env.js", "ping.js"]) {
    const result = run(script, `[{"url":"https://example.com","key":"${secret}",}]`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /SUPABASES_JSON is not valid JSON/);
    assert.ok(!(result.stdout + result.stderr).includes(secret));
  }
});

test("runtime refuses a partly invalid list before any HTTP requests", () => {
  const result = run("ping.js", JSON.stringify([
    { url: "http://127.0.0.1:1", key: "test" },
    { url: "https://example.supabase.co" },
  ]));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /entry 2.*key/);
  assert.ok(!result.stdout.includes("Pinging"));
});
