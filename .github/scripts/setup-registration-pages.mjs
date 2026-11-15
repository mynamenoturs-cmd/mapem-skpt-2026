// Separate Cloudflare Pages project for Year 1 registration.
// Uses existing GitHub Actions credentials and the shared D1 registration tables.
// Never prints or stores secret values in the repository.
const {CLOUDFLARE_API_TOKEN,CLOUDFLARE_ACCOUNT_ID,MAPEM_D1_DATABASE_ID,MAPEM_ADMIN_EMAILS}=process.env;
if(![CLOUDFLARE_API_TOKEN,CLOUDFLARE_ACCOUNT_ID,MAPEM_D1_DATABASE_ID,MAPEM_ADMIN_EMAILS].every(x=>x?.trim()))throw Error('Konfigurasi Pages/D1/admin emails tidak lengkap.');
if(!/^[a-f0-9-]{36}$/i.test(MAPEM_D1_DATABASE_ID))throw Error('ID D1 tidak sah.');
const project='pendaftaran-tahun1-2027-skpt';
const root='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)+'/pages/projects';
const auth={Authorization:'Bearer '+CLOUDFLARE_API_TOKEN,Accept:'application/json','Content-Type':'application/json'};
async function call(method,path,body){
 const response=await fetch(root+path,{method,headers:auth,...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({}));
 if(response.status===404&&method==='GET')return null;
 if(!response.ok||!data.success){const message=(data.errors||[]).map(e=>e.message).join('; ')||'Cloudflare rejected request';throw Error(method+' '+path+' failed: '+response.status+' '+message);}
 return data.result;
}
let before=await call('GET','/'+project);
if(!before){
 console.log('Mencipta projek Cloudflare Pages pendaftaran tersendiri...');
 await call('POST','',{name:project,production_branch:'main'});
 before=await call('GET','/'+project);
}
if(!before)throw Error('Projek baharu tidak dapat disahkan.');
const original=before.deployment_configs?.production||{};
const current=original.d1_databases||{};
if(current.DB?.id&&current.DB.id!==MAPEM_D1_DATABASE_ID)throw Error('D1 sedia ada berbeza. Tiada perubahan dibuat.');
const envVars=original.env_vars||{};
await call('PATCH','/'+project,{deployment_configs:{production:{
 d1_databases:{...current,DB:{id:MAPEM_D1_DATABASE_ID}},
 env_vars:{...envVars,ADMIN_EMAILS:{type:'secret_text',value:MAPEM_ADMIN_EMAILS.trim()}}
}}});
const after=await call('GET','/'+project);
if(after.deployment_configs?.production?.d1_databases?.DB?.id!==MAPEM_D1_DATABASE_ID||!after.deployment_configs?.production?.env_vars?.ADMIN_EMAILS)throw Error('Konfigurasi binding D1/admin untuk Pages tidak dapat disahkan.');
console.log('Cloudflare Pages Pendaftaran Tahun 1 2027: projek, D1 dan kawalan admin disahkan.');
