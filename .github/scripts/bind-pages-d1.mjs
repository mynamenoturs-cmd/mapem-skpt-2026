// Configure production D1 binding in existing Cloudflare Pages project.
// No GitHub/Cloudflare secrets are logged or committed.
// Intentionally preserves other D1 bindings and does not modify env_vars.
const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, MAPEM_D1_DATABASE_ID } = process.env;
if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !MAPEM_D1_DATABASE_ID) {
  throw new Error("Cloudflare credentials/IDs are missing from GitHub Actions.");
}
if (!/^[a-f0-9-]{36}$/i.test(MAPEM_D1_DATABASE_ID)) {
  throw new Error("Invalid D1 UUID.");
}
const project = "mapem-skpt-2026";
const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/pages/projects/${project}`;
const headers = { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, Accept: "application/json" };
async function request(method, body) {
  const response = await fetch(base, {
    method,
    headers: body ? {...headers, "Content-Type": "application/json"} : headers,
    ...(body ? {body: JSON.stringify(body)} : {})
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok || !data.success) {
    const messages = Array.isArray(data.errors) ? data.errors.map(e=>e.message).filter(Boolean).join("; ") : "";
    throw new Error(`Cloudflare Pages project ${method} failed (HTTP ${response.status}): ${messages || "API rejected request"}`);
  }
  return data.result;
}
const before = await request("GET");
const original = before?.deployment_configs?.production?.d1_databases || {};
if (original.DB?.id && original.DB.id !== MAPEM_D1_DATABASE_ID) {
  throw new Error("Existing DB binding points to a different D1 database; refusing to overwrite.");
}
if (original.DB?.id !== MAPEM_D1_DATABASE_ID) {
  await request("PATCH", {
    deployment_configs: {
      production: {
        d1_databases: { ...original, DB: { id: MAPEM_D1_DATABASE_ID } }
      }
    }
  });
  console.log("Production D1 binding DB saved to existing Pages project.");
} else {
  console.log("Production D1 binding DB is already configured correctly.");
}
const after = await request("GET");
if (after?.deployment_configs?.production?.d1_databases?.DB?.id !== MAPEM_D1_DATABASE_ID) {
  throw new Error("Cloudflare API did not persist expected DB binding.");
}
console.log("Verified: Pages production DB binding matches configured D1 UUID.");
