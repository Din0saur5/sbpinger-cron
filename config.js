function loadProjectsFromEnv(env = process.env) {
  const raw = env.SUPABASES_JSON;
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Missing SUPABASES_JSON. Set it to a non-empty JSON array of {url,key} objects.");
  }

  let projects;
  try {
    projects = JSON.parse(raw);
  } catch {
    // JSON.parse's error can include the input, which contains API keys.
    throw new Error("SUPABASES_JSON is not valid JSON. Use double-quoted property names and strings, with no trailing commas.");
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("SUPABASES_JSON must be a non-empty JSON array of {url,key} objects.");
  }

  return projects.map((project, index) => {
    const label = `SUPABASES_JSON entry ${index + 1}`;
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      throw new Error(`${label} must be an object with "url" and "key" fields.`);
    }
    if (typeof project.url !== "string" || !project.url.trim()) {
      throw new Error(`${label}: "url" must be a non-empty string.`);
    }
    if (typeof project.key !== "string" || !project.key.trim()) {
      throw new Error(`${label}: "key" must be a non-empty string.`);
    }
    if (/[^\x21-\x7e]/.test(project.key)) {
      throw new Error(`${label}: "key" must contain only printable ASCII characters, with no spaces or newlines.`);
    }

    const url = project.url.trim().replace(/\/+$/, "");
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`${label}: "url" must be a valid HTTP or HTTPS project URL.`);
    }
    if (
      !/^https?:\/\//i.test(url) || /\s/.test(url) ||
      parsed.username || parsed.password ||
      parsed.pathname !== "/" || url.includes("?") || url.includes("#")
    ) {
      throw new Error(`${label}: "url" must be an HTTP or HTTPS project base URL without credentials, a path, query, or fragment.`);
    }

    return { id: `env-${index + 1}`, url: parsed.origin, key: project.key };
  });
}

module.exports = { loadProjectsFromEnv };
