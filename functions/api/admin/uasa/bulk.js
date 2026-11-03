// Private UASA bulk import for signed-in MaPeM administrators.
// Student names are supplied by the logged-in admin; never stored in GitHub.
const HEAD={'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:HEAD});
const clean=v=>String(v||'').trim().replace(/\s+/g,' ');
const normalized=v=>clean(v).toLocaleLowerCase('ms');
const YEAR_COUNTS={1:9,2:9,3:8};

async function authenticate(request,env){
 if(!env.DB||!env.APP_ORIGIN)throw{status:503,message:'Portal belum dikonfigurasi.'};
 if(request.headers.get('origin')!==String(env.APP_ORIGIN).replace(/\/$/,''))throw{status:403,message:'Permintaan luar portal ditolak.'};
 const cookie=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-mapem_session='));
 const token=cookie?.slice('__Host-mapem_session='.length);
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw{status:401,message:'Sila log masuk dahulu.'};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 const user=await env.DB.prepare('SELECT u.email FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(hash,Math.floor(Date.now()/1000)).first();
 if(!user?.email)throw{status:401,message:'Sesi telah tamat. Sila log masuk semula.'};
 const email=String(user.email).trim().toLowerCase();
 const admins=new Set(String(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
 if(!admins.has(email)&&!(await env.DB.prepare('SELECT email FROM admin_grants WHERE email=?').bind(email).first()))throw{status:403,message:'Hanya pentadbir boleh mengimport penerima UASA.'};
 return email;
}
function validateRecords(raw,classes){
 if(!Array.isArray(raw)||raw.length!==classes.length)throw{status:400,message:'Fail mesti mengandungi 26 kelas Tahap 1.'};
 const allowed=new Map(classes.map(c=>[c.id,c]));
 const records=new Map(),totals={1:0,2:0,3:0},counts={1:0,2:0,3:0};
 for(const item of raw){
  if(!item||typeof item!=='object'||!allowed.has(item.classId)||records.has(item.classId))throw{status:400,message:'Kelas tidak sah, tidak lengkap atau berulang dalam fail.'};
  if(!Array.isArray(item.names)||item.names.length<1||item.names.length>10)throw{status:400,message:'Senarai nama tidak sah bagi kelas '+item.classId};
  const names=item.names.map(clean);
  if(names.some(n=>n.length<2||n.length>160||/[<>]/.test(n))||new Set(names.map(normalized)).size!==names.length)throw{status:400,message:'Semak nama murid kelas '+item.classId};
  const year=allowed.get(item.classId).year;totals[year]+=names.length;counts[year]++;records.set(item.classId,names);
 }
 for(const y of [1,2,3])if(totals[y]!==10||counts[y]!==YEAR_COUNTS[y])throw{status:400,message:'Tahun '+y+' mesti mempunyai '+YEAR_COUNTS[y]+' kelas dan 10 penerima.'};
 return {records,totals};
}
export async function onRequestPost({request,env}){
 try{
  const email=await authenticate(request,env);
  if(!request.headers.get('content-type')?.includes('application/json'))throw{status:415,message:'Fail import mesti dihantar sebagai JSON.'};
  const bodyText=await request.text();
  if(bodyText.length>50000)throw{status:413,message:'Fail import terlalu besar.'};
  let body;try{body=JSON.parse(bodyText)}catch{throw{status:400,message:'Format fail JSON tidak sah.'}}
  if(body?.schemaVersion!==1||body?.award!=='uasa'||!['preview','commit'].includes(body.mode))throw{status:400,message:'Format atau mod import tidak dikenali.'};
  const classes=(await env.DB.prepare('SELECT id,year,name FROM classes WHERE year BETWEEN 1 AND 3 ORDER BY year,name').all()).results||[];
  if(classes.length!==26)throw{status:409,message:'Senarai kelas portal tidak sepadan dengan 26 kelas Tahap 1.'};
  const {records,totals}=validateRecords(body.records,classes);
  const drafts=(await env.DB.prepare("SELECT class_id,names_json,version FROM drafts WHERE category_id='uasa' AND substr(class_id,1,1) IN ('1','2','3')").all()).results||[];
  const pubs=(await env.DB.prepare('SELECT class_id FROM publications WHERE class_id IN (SELECT id FROM classes WHERE year BETWEEN 1 AND 3)').all()).results||[];
  const existing=new Map(drafts.map(x=>[x.class_id,x]));
  const locked=pubs.map(x=>x.class_id);
  const expectedVersions=Object.fromEntries(classes.map(c=>[c.id,existing.get(c.id)?.version??0]));
  const changed=classes.filter(c=>JSON.stringify(records.get(c.id))!==JSON.stringify(JSON.parse(existing.get(c.id)?.names_json||'[]'))).map(c=>c.id);
  if(body.mode==='preview')return reply({ok:true,mode:'preview',totals,classes:classes.length,changed,locked,expectedVersions});
  if(locked.length)throw{status:423,message:'Terdapat '+locked.length+' kelas yang telah diterbitkan. Tarik balik penerbitan dahulu; tiada data diubah.'};
  if(body.confirm!==true||!body.expectedVersions||typeof body.expectedVersions!=='object'||Array.isArray(body.expectedVersions))throw{status:400,message:'Sila buat pratonton dahulu dan sahkan versi data.'};
  for(const c of classes)if(body.expectedVersions[c.id]!==expectedVersions[c.id])throw{status:409,message:'Data portal telah berubah. Sila buat pratonton semula sebelum import.'};
  if(!env.DB.batch)throw{status:503,message:'Transaksi D1 tidak tersedia. Tiada data diubah.'};
  const statements=[];
  for(const c of classes){
   // D1.batch is transactional; a failed version/published guard rolls back every class.
   statements.push(env.DB.prepare("SELECT CASE WHEN (SELECT COALESCE((SELECT version FROM drafts WHERE class_id=? AND category_id='uasa'),0))=? AND NOT EXISTS(SELECT 1 FROM publications WHERE class_id=?) THEN 1 ELSE json_extract('{','$') END AS ok").bind(c.id,expectedVersions[c.id],c.id));
   statements.push(env.DB.prepare("INSERT INTO drafts(class_id,category_id,names_json,version,updated_at,updated_by,editor_role,edit_note) VALUES(?,'uasa',?,1,datetime('now'),?,'admin','Import UASA Tahap 1') ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=drafts.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by,editor_role=excluded.editor_role,edit_note=excluded.edit_note").bind(c.id,JSON.stringify(records.get(c.id)),email));
   statements.push(env.DB.prepare("UPDATE classes SET updated_at=datetime('now') WHERE id=?").bind(c.id));
  }
  statements.push(env.DB.prepare("INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,note,source_table) VALUES(?,'admin','import_uasa_tahap1',NULL,'uasa',?,'actions')").bind(email,'30 penerima: Tahun 1=10, Tahun 2=10, Tahun 3=10; 26 kelas'));
  try{await env.DB.batch(statements)}catch{throw{status:409,message:'Import dibatalkan kerana konflik/ralat transaksi. Tiada perubahan separa dibuat; sila pratonton semula.'}}
  return reply({ok:true,mode:'commit',totals,classes:classes.length,saved:30,published:false,message:'30 nama UASA disimpan sebagai draf; penerbitan tidak dilakukan secara automatik.'});
 }catch(e){return reply({error:e?.message||'Ralat import UASA.'},Number.isInteger(e?.status)?e.status:500)}
}
