require("dotenv").config();
const { loadProjectsFromEnv } = require("./config");

try {
  const projects = loadProjectsFromEnv();
  console.log(`SUPABASES_JSON validation passed: ${projects.length} project(s) configured.`);
} catch (error) {
  console.error(`Configuration error: ${error.message}`);
  process.exitCode = 1;
}
