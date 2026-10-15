// Configure OAuth in the existing Cloudflare Pages project.
// Google credentials are read from GitHub Actions only, never committed.
const {CLOUDFLARE_API_TOKEN,CLOUDFLARE_ACCOUNT_ID,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,MAPEM_ADMIN_EMAILS}=process.env;
if(!CLOUDFLARE_API_TOKEN||!CLOUDFLARE_ACCOUNT_ID)throw Error("Missing Cloudflare GitHub Actions credentials.");
const appOrigin="https://mapem-skpt-2026.pages.dev";
const url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/pages/projects/mapem-skpt-2026`;
const headers={Authorization:`Bearer ${CLOUDFLARE_API_TOKEN}`,"Content-Type":"application/json",Accept:"application/json"};
async function request(method,body){
 const res=await fetch(url,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
 const json=await res.json().catch(()=>({}));
 if(!res.ok||!json.success)throw Error(`Cloudflare Pages ${method} failed (HTTP ${res.status}).`);
 return json.result;
}
const before=await request("GET");
if(!before?.deployment_configs?.production)throw Error("Cloudflare Production project settings missing.");
const complete=[GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,MAPEM_ADMIN_EMAILS].every(x=>Boolean(x?.trim()));
const anyProvided=[GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,MAPEM_ADMIN_EMAILS].some(x=>Boolean(x?.trim()));
const env_vars={APP_ORIGIN:{type:"plain_text",value:appOrigin}};
if(complete){
 const emails=MAPEM_ADMIN_EMAILS.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!emails.length||emails.some(s=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))throw Error("MAPEM_ADMIN_EMAILS contains an invalid email.");
 if(!/^[a-zA-Z0-9_.\-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID.trim()))throw Error("GOOGLE_CLIENT_ID is not a valid OAuth client ID.");
 env_vars.GOOGLE_CLIENT_ID={type:"plain_text",value:GOOGLE_CLIENT_ID.trim()};
 env_vars.GOOGLE_CLIENT_SECRET={type:"secret_text",value:GOOGLE_CLIENT_SECRET.trim()};
 env_vars.ADMIN_EMAILS={type:"secret_text",value:emails.join(",")};
 console.log("Applying Google OAuth keys securely to Pages Production.");
}else{
 console.log(anyProvided?"Google OAuth settings incomplete; applying APP_ORIGIN only.":"Google OAuth has not been configured; applying APP_ORIGIN only.");
}
await request("PATCH",{deployment_configs:{production:{env_vars}}});
const after=await request("GET"),vars=after?.deployment_configs?.production?.env_vars||{};
if(vars.APP_ORIGIN?.value!==appOrigin)throw Error("APP_ORIGIN not verified.");
if(complete){
 for(const key of ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","ADMIN_EMAILS"]){if(!vars[key])throw Error(`Missing ${key} after Cloudflare update.`);}
 console.log("Google OAuth settings present, APP_ORIGIN verified. No secret values logged.");
}else console.log("APP_ORIGIN configured. Waiting for user to add Google Cloud OAuth credentials.");
