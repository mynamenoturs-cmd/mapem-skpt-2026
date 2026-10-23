// MaPeM 2026: same-origin Google OAuth, server-side sessions, explicit RBAC.
// Teacher edits are scoped to the class assigned to their verified Google email.
export const CATEGORIES = [
 {id:'pbd',name:'Anugerah Pencapaian PBD Terbaik',scope:'year',quota:{1:45,2:45,3:40,4:40,5:40},teacher:true,classLimit:5,owner:'Guru kelas',note:'5 murid setiap kelas; guru kelas mengisi PBD.'},
 {id:'uasa',name:'Anugerah 10 Pencapaian Terbaik (UASA)',scope:'year',quota:{1:10,2:10,3:10},years:[1,2,3],teacher:false,owner:'Cikgu Fitri'},
 {id:'matapelajaran',name:'Anugerah Pencapaian Mata Pelajaran Terbaik',scope:'year',quota:{1:30,2:30,3:30},years:[1,2,3],teacher:false,owner:'Cikgu Fitri'},
 {id:'cemara',name:'Anugerah Ikon Cemara Tahap 1 (L/P)',scope:'total',quota:2,teacher:true,nomination:true,years:[3],owner:'GK calonkan; penyelaras pilih',note:'Pencalonan Tahun 3 sahaja.'},
 {id:'kurikulum',name:'Anugerah Khas Kurikulum Tahap 1 (L/P)',scope:'total',quota:2,teacher:true,nomination:true,years:[3],owner:'GK calonkan; penyelaras pilih',note:'Pencalonan Tahun 3 sahaja.'},
 {id:'kokurikulum',name:'Harapan Kokurikulum Tahap 1 (L/P)',scope:'total',quota:2,teacher:true,nomination:true,years:[3],owner:'GK calonkan; penyelaras pilih',note:'Pencalonan Tahun 3 sahaja.'},
 {id:'hem',name:'Harapan HEM (L/P)',scope:'total',quota:2,teacher:true,nomination:true,years:[3],owner:'GK calonkan; penyelaras pilih',note:'Pencalonan Tahun 3 sahaja.'},
 {id:'ains',name:'AINS NILAM — Hamper Individu',scope:'year',quota:{1:18,2:18,3:16},years:[1,2,3],teacher:false,owner:'Guru PSS'},
 {id:'ains-tokoh',name:'Tokoh AINS NILAM 2026 — Tahap 1',scope:'total',quota:3,years:[1,2,3],teacher:false,owner:'Guru PSS'},
 {id:'delima',name:'Ikon Navigator DELIMa — Tahap 1',scope:'total',quota:3,years:[1,2,3],teacher:false,owner:'Teacher Abby',note:'3 penerima Tahap 1; PK1 memaklumkan calon telah ada.'},
 {id:'plan',name:'Anugerah Cerdas PLaN',scope:'total',quota:6,years:[1,2,3,4,5],teacher:false,owner:'Cikgu Puja',note:'6 penerima bagi Tahap 1 dan 2 secara gabungan (pembahagian tahap perlu disahkan). Dokumen asal: 3 PLaN + 3 Pemulihan Khas.'},
 {id:'lonjakan-mawar',name:'Anugerah Pencapaian Lonjakan Akademik M.A.W.A.R',scope:'year',quota:{2:10,3:14,4:2,5:4},years:[2,3,4,5],teacher:false,owner:'Cikgu Norbaizura',note:'Jumlah 30 penerima; Tahun 2=10, 3=14, 4=2, 5=4.'},
 {id:'mawar',name:'Anugerah Tokoh Murid M.A.W.A.R (L/P)',scope:'year',quota:{3:2},years:[3],teacher:false,owner:'Cikgu Marwyn',note:'Kategori Tokoh berasingan daripada Lonjakan Akademik.'},
 {id:'uasa-t2',name:'Anugerah 10 Pencapaian Terbaik (UASA) — Tahap 2',scope:'year',quota:{4:10,5:10},years:[4,5],teacher:false,owner:'Cikgu Fenny / Cikgu Fiona'},
 {id:'matapelajaran-t2',name:'Anugerah Pencapaian Mata Pelajaran Terbaik — Tahap 2',scope:'year',quota:{4:7,5:7},years:[4,5],teacher:false,owner:'Cikgu Fenny / Cikgu Fiona'},
 {id:'ains-t2',name:'Ikon AINS NILAM — Tahap 2',scope:'year',quota:{4:16,5:16},years:[4,5],teacher:false,owner:'Cikgu Nadiah Mohd Naim / Cikgu Laila',note:'2 penerima setiap kelas.'},
 {id:'commonwealth-t2',name:'The Queen’s Commonwealth Writing Competition 2026 — Tahap 2',scope:'total',quota:20,years:[4,5],teacher:false,owner:'Urus Setia'},
 {id:'ains-tokoh-t2',name:'Tokoh AINS NILAM — Tahap 2 (L/P)',scope:'year',quota:{4:1,5:1},years:[4,5],teacher:false,owner:'Cikgu Nadiah Mohd Naim / Cikgu Laila'},
 {id:'delima-tokoh-t2',name:'Ikon Navigator DELIMa — Tahap 2',scope:'total',quota:3,years:[4,5],teacher:false,owner:'Cikgu Fandi Ajam',note:'3 penerima Tahap 2; calon telah dimaklumkan oleh PK1.'},
 {id:'hem-t2',name:'Tokoh Harapan HEM — Tahap 2 (L/P)',scope:'total',quota:2,years:[4,5],teacher:false,owner:'Urus Setia'},
 {id:'kokurikulum-t2',name:'Tokoh Harapan Kokurikulum — Tahap 2 (L/P)',scope:'total',quota:2,years:[4,5],teacher:false,owner:'Urus Setia'},
 {id:'kurikulum-t2',name:'Tokoh Harapan Kurikulum — Tahap 2 (L/P)',scope:'total',quota:2,years:[4,5],teacher:false,owner:'Urus Setia'},
 {id:'cemara-t2',name:'Anugerah Ikon Cemara — Tahap 2 (L/P)',scope:'total',quota:2,years:[4,5],teacher:false,owner:'Urus Setia'}

];

const HEAD={'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex,nofollow'};
const SESSION_COOKIE='__Host-mapem_session';
const STATE_COOKIE='__Host-mapem_oauth';
const encoder=new TextEncoder();
const JSON_RESPONSE=(payload,status=200,headers={})=>new Response(JSON.stringify(payload),{status,headers:{...HEAD,...headers}});
const fail=(message,status=400)=>JSON_RESPONSE({error:message},status);
const now=()=>Math.floor(Date.now()/1000);
const rnd=(bytes=32)=>{const a=new Uint8Array(bytes);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');};
async function sha256(v){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(v));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
function cookies(request){return Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(p=>p.trim()).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));}
function cookie(name,val,seconds){return `${name}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;}
function redirect(url,headers={}){return new Response(null,{status:302,headers:{Location:url,'Cache-Control':'no-store',...headers}});}
function adminEmails(env){return new Set(String(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));}
async function isAdminEmail(env,email){return adminEmails(env).has(email)||!!(await env.DB.prepare('SELECT email FROM admin_grants WHERE email=?').bind(email).first());}
function origin(env){return String(env.APP_ORIGIN||'').replace(/\/$/,'');}
function getConfig(env){return !!(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && /^https:\/\/[^/]+$/.test(origin(env)) && adminEmails(env).size>0);}
function googleCallback(env){return origin(env)+'/api/auth/google/callback';}
function safeError(message,status=400){const e=new Error(message);e.status=status;throw e;}
async function reqBody(request){if(!request.headers.get('content-type')?.includes('application/json'))safeError('Permintaan mesti menggunakan JSON.',415);const t=await request.text();if(t.length>65536)safeError('Data terlalu besar.',413);try{return JSON.parse(t)}catch{safeError('Format JSON tidak sah.')}}
function names(input){if(!Array.isArray(input)||input.length>150)safeError('Maksimum 150 nama bagi satu kategori.');const list=input.map(x=>String(x||'').trim().replace(/\s+/g,' ')).filter(Boolean);if(list.some(x=>x.length<2||x.length>160||/[<>]/.test(x)))safeError('Nama mesti 2–160 aksara dan tanpa simbol HTML.');if(new Set(list.map(x=>x.toLocaleLowerCase('ms'))).size!==list.length)safeError('Terdapat nama berulang dalam kategori.');return list;}
async function userFor(request,env){const sid=cookies(request)[SESSION_COOKIE];if(!sid||!/^[a-f0-9]{64}$/.test(sid))return null;const hash=await sha256(sid);
 const user=await env.DB.prepare('SELECT u.sub,u.email,u.name,s.expires_at FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(hash,now()).first();
 if(!user)return null;const email=user.email.toLowerCase();const isAdmin=await isAdminEmail(env,email);
 const assignment=await env.DB.prepare('SELECT a.class_id,c.year,c.name AS class_name FROM teacher_assignments a JOIN classes c ON c.id=a.class_id WHERE a.email=? AND c.year BETWEEN 1 AND 5').bind(email).first();
 const tasks=(await env.DB.prepare('SELECT category_id FROM category_assignments WHERE email=? ORDER BY category_id').bind(email).all()).results||[];
 return {sub:user.sub,email,name:user.name,categoryIds:tasks.map(t=>t.category_id),role:isAdmin?'admin':assignment?'teacher':tasks.length?'specialist':'viewer',classId:assignment?.class_id||null,className:assignment?`${assignment.year} ${assignment.class_name}`:null};}
function requireRole(user,role){if(!user)safeError('Sila log masuk dengan akaun Google.',401);if(role==='admin'&&user.role!=='admin')safeError('Akses pentadbir sahaja.',403);if(role==='teacher'&&!user.classId)safeError('Akses guru kelas sahaja.',403);}
function categoryOf(id,year,teacher){return year>=1&&year<=5?CATEGORIES.find(c=>c.id===id&&(teacher?c.teacher:c.id!=='pbd')&&(!c.years||c.years.includes(year))):undefined;}
async function saveDraft(env,classId,categoryId,version,list,table='drafts',limit=null,year=0){
 if(!['drafts','nominations'].includes(table))safeError('Jadual simpanan tidak sah.');
 if(!Number.isSafeInteger(version)||version<0)safeError('Versi simpanan tidak sah.');
 const current=await env.DB.prepare(`SELECT version FROM ${table} WHERE class_id=? AND category_id=?`).bind(classId,categoryId).first();
 if((current?.version??0)!==version)safeError('Data telah diubah di peranti lain. Muat semula sebelum menyimpan.',409);
 const sql=`INSERT INTO ${table}(class_id,category_id,names_json,version,updated_at) SELECT ?,?,?,1,datetime('now') WHERE (? IS NULL OR (SELECT COALESCE(SUM(json_array_length(names_json)),0) FROM ${table} WHERE category_id=? AND class_id!=? AND (?=0 OR substr(class_id,1,1)=?))+?<=?) ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=${table}.version+1,updated_at=datetime('now') WHERE ${table}.version=?`;
 const r=await env.DB.prepare(sql).bind(classId,categoryId,JSON.stringify(list),limit,categoryId,classId,year,String(year),list.length,limit,version).run();
 if(r.meta?.changes!==1)safeError(limit!=null?'Kuota keseluruhan kategori akan melebihi '+limit+' penerima. Semak kelas lain atau muat semula.':'Versi simpanan berubah. Muat semula sebelum menyimpan.',409);
 await env.DB.prepare("UPDATE classes SET updated_at=datetime('now') WHERE id=?").bind(classId).run();
 return {ok:true,version:version+1,total:list.length};
}
function canWork(user,id,assignedOnly=false){return (!assignedOnly&&user?.role==='admin')||user?.categoryIds?.includes(id);}
async function workData(env,cls,cat){
 const row=await env.DB.prepare('SELECT names_json,version FROM drafts WHERE class_id=? AND category_id=?').bind(cls.id,cat.id).first();
 const final= row?{names:JSON.parse(row.names_json),version:row.version}:{names:[],version:0};
 const review=await env.DB.prepare('SELECT version FROM final_reviews WHERE class_id=? AND category_id=?').bind(cls.id,cat.id).first();
 const pub=await env.DB.prepare('SELECT class_id FROM publications WHERE class_id=?').bind(cls.id).first();
 const all=cat.nomination?(await env.DB.prepare('SELECT n.class_id,n.names_json,c.year,c.name FROM nominations n JOIN classes c ON c.id=n.class_id WHERE n.category_id=? ORDER BY c.year,c.name').bind(cat.id).all()).results||[]:[];
 return {class:cls,category:cat,draft:final,confirmedLP:review?.version===final.version,published:!!pub,nominees:all.filter(n=>!cat.years||cat.years.includes(n.year)).map(n=>({classId:n.class_id,label:n.year+' '+n.name,names:JSON.parse(n.names_json)}))};
}
async function saveFinal(env,user,b,assignedOnly=false){
 const id=validateClassId(b.classId),cls=await env.DB.prepare('SELECT id,year,name,status FROM classes WHERE id=?').bind(id).first();
 const cat=cls&&categoryOf(b.categoryId,cls.year,false);if(!cat||!canWork(user,cat.id,assignedOnly))safeError('Kategori ini bukan tugasan anda.',403);
 if(await env.DB.prepare('SELECT class_id FROM publications WHERE class_id=?').bind(id).first())safeError('Senarai kelas telah diterbitkan. Minta admin menarik balik penerbitan sebelum menyunting.',423);
 const list=names(b.names);
 if(list.length&&(cat.nomination||cat.id==='mawar')&&b.confirmedLP!==true)safeError('Sahkan semakan L/P dan keputusan pemilihan dahulu.');
 if(cat.nomination&&list.length){
  const candidate=await env.DB.prepare('SELECT names_json FROM nominations WHERE class_id=? AND category_id=?').bind(id,cat.id).first();
  const old=await env.DB.prepare('SELECT names_json FROM drafts WHERE class_id=? AND category_id=?').bind(id,cat.id).first();
  const allowed=new Set([...JSON.parse(candidate?.names_json||'[]'),...JSON.parse(old?.names_json||'[]')].map(n=>n.toLocaleLowerCase('ms')));
  if(list.some(n=>!allowed.has(n.toLocaleLowerCase('ms'))))safeError('Pilih nama daripada pencalonan guru kelas.');
 }
 const limit=cat.scope==='year'?cat.quota?.[cls.year]:cat.quota;
 const r=await saveDraft(env,id,cat.id,Number(b.version),list,'drafts',limit??null,(cat.scope==='year'||cat.years?.length===1)?cls.year:0);
 if(cat.nomination||cat.id==='mawar')await env.DB.prepare("INSERT INTO final_reviews(class_id,category_id,version,confirmed_by) VALUES(?,?,?,?) ON CONFLICT(class_id,category_id) DO UPDATE SET version=excluded.version,confirmed_by=excluded.confirmed_by,confirmed_at=datetime('now')").bind(id,cat.id,r.version,user.email).run();
 return r;
}

async function overview(env){const [classes,drafts,assignments,publications]=await Promise.all([
 env.DB.prepare('SELECT id,year,name,status,submitted_at,updated_at FROM classes WHERE year BETWEEN 1 AND 5 ORDER BY year,name').all(),
 env.DB.prepare('SELECT class_id,category_id,names_json,version FROM drafts').all(),
 env.DB.prepare('SELECT a.email,a.class_id FROM teacher_assignments a JOIN classes c ON c.id=a.class_id WHERE c.year BETWEEN 1 AND 5 ORDER BY a.class_id').all(),
 env.DB.prepare('SELECT p.class_id,p.published_at FROM publications p JOIN classes c ON c.id=p.class_id WHERE c.year BETWEEN 1 AND 5').all()]);
 const counts={};const quota={};for(const row of drafts.results||[]){if(+row.class_id[0]>5)continue;const cat=CATEGORIES.find(c=>c.id===row.category_id);if(cat?.years&&!cat.years.includes(+row.class_id[0]))continue;const n=JSON.parse(row.names_json).length;counts[row.class_id]=(counts[row.class_id]||0)+n;const year=+row.class_id[0];quota[row.category_id]??={};quota[row.category_id][year]=(quota[row.category_id][year]||0)+n;}
 const pub=new Map((publications.results||[]).map(x=>[x.class_id,x.published_at]));
 return {classes:(classes.results||[]).map(x=>({...x,total:counts[x.id]||0,publishedAt:pub.get(x.id)||null})),assignments:assignments.results||[],categories:CATEGORIES,quota};}
function csvEscape(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
async function exportReportData(env,url){
 const source=url.searchParams.get('source')||'working',year=Number(url.searchParams.get('year')||0),tahap=Number(url.searchParams.get('tahap')||0);if(!['working','published'].includes(source)||![0,1,2,3,4,5].includes(year)||![0,1,2].includes(tahap)||(tahap===1&&year>3)||(tahap===2&&year>0&&year<4))safeError('Pilihan laporan tidak sah.');
 const classes=(await env.DB.prepare('SELECT id,year,name,status FROM classes WHERE year BETWEEN 1 AND 5').all()).results||[],lookup=new Map(classes.map(c=>[c.id,c])),published=(await env.DB.prepare('SELECT class_id,snapshot_json FROM publications').all()).results||[],publishedIds=new Set(published.map(p=>p.class_id));
 const raw=source==='published'?published.flatMap(p=>Object.entries(JSON.parse(p.snapshot_json)).map(([category_id,names])=>({class_id:p.class_id,category_id,names_json:JSON.stringify(names)}))):(await env.DB.prepare('SELECT class_id,category_id,names_json FROM drafts').all()).results||[];
 const order=new Map(CATEGORIES.map((c,i)=>[c.id,i])),rows=[];
 for(const item of raw){const cls=lookup.get(item.class_id),cat=CATEGORIES.find(c=>c.id===item.category_id);if(!cls||!cat||(year&&cls.year!==year)||(tahap===1&&cls.year>3)||(tahap===2&&cls.year<4)||(cat.years&&!cat.years.includes(cls.year)))continue;for(const name of JSON.parse(item.names_json))rows.push({categoryId:cat.id,year:cls.year,classId:cls.id,className:cls.year+' '+cls.name,name,status:cls.status==='submitted'?'Dihantar':'Draf',publication:publishedIds.has(cls.id)?'Diterbitkan':'Belum diterbitkan'});}
 rows.sort((a,b)=>order.get(a.categoryId)-order.get(b.categoryId)||a.year-b.year||a.className.localeCompare(b.className,'ms')||a.name.localeCompare(b.name,'ms'));
 return {source,year,tahap,generatedAt:new Date().toISOString(),categories:CATEGORIES.map(c=>({id:c.id,name:c.name,years:c.years||[1,2,3,4,5]})),rows};
}
function exportCSV(data){const lookup=new Map(data.categories.map(c=>[c.id,c.name])),body=[['Tahap','Kategori Anugerah','Bil','Tahun','Kelas','Nama Penuh Murid','Status Pengisian','Penerbitan']];let last='',n=0;for(const r of data.rows){if(last!==r.categoryId){last=r.categoryId;n=0;}body.push([r.year<=3?'Tahap 1':'Tahap 2',lookup.get(r.categoryId),++n,r.year,r.className,r.name,r.status,r.publication]);}
 return new Response('\uFEFF'+body.map(a=>a.map(csvEscape).join(',')).join('\r\n'),{headers:{'content-type':'text/csv;charset=utf-8','content-disposition':'attachment; filename=mapem-skpt-2026.csv','cache-control':'no-store','x-content-type-options':'nosniff'}});}
function validateClassId(v){if(typeof v!=='string'||!/^[1-5]-(amber|crystal|diamond|emerald|jade|pearl|ruby|sapphire|topaz)$/.test(v)||(+v[0]>=3&&v.endsWith('-amber')))safeError('Kelas tidak sah.');return v;}
function adminTeacherEmail(v){const value=String(v||'').trim().toLowerCase();if(value.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))safeError('Alamat e-mel tidak sah.');return value;}
export async function onRequest({request,env}){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');
 try{
  if(path==='health'&&request.method==='GET'){
   const databaseBound=!!env.DB;
   let databaseConnected=false;
   if(databaseBound){try{databaseConnected=!!(await env.DB.prepare('SELECT COUNT(*) AS n FROM classes').first());}catch{databaseConnected=false;}}
   return JSON_RESPONSE({ok:true,configured:getConfig(env),databaseBound,databaseConnected});
  }
  if(!env.DB)return fail('D1 belum disambungkan menggunakan binding DB.',503);
  if(!getConfig(env))return fail('Konfigurasi Google Login/APP_ORIGIN/ADMIN_EMAILS belum lengkap.',503);
  if(path==='auth/google/start'&&request.method==='GET'){
   const state=rnd(),stateHash=await sha256(state);await env.DB.prepare('INSERT INTO oauth_states(state_hash,expires_at) VALUES(?,?)').bind(stateHash,now()+600).run();
   const qp=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:googleCallback(env),response_type:'code',scope:'openid email profile',state,access_type:'online',prompt:'select_account'});
   return redirect('https://accounts.google.com/o/oauth2/v2/auth?'+qp.toString(),{'Set-Cookie':cookie(STATE_COOKIE,state,600)});
  }
  if(path==='auth/google/callback'&&request.method==='GET'){
   const code=url.searchParams.get('code'),state=url.searchParams.get('state'),stored=cookies(request)[STATE_COOKIE];
   if(!code||!state||!stored||!(/^[a-f0-9]{64}$/.test(state))||state!==stored)return redirect(origin(env)+'/?login=invalid',{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
   const stateHash=await sha256(state),row=await env.DB.prepare('SELECT state_hash FROM oauth_states WHERE state_hash=? AND expires_at>?').bind(stateHash,now()).first();
   if(!row)return redirect(origin(env)+'/?login=expired',{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
   await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash=?').bind(stateHash).run();
   const token=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:googleCallback(env),grant_type:'authorization_code'})});
   if(!token.ok)return redirect(origin(env)+'/?login=failed',{'Set-Cookie':cookie(STATE_COOKIE,'',0)});
   const t=await token.json();if(!t.access_token)return redirect(origin(env)+'/?login=failed');
   const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+t.access_token}});
   if(!info.ok)return redirect(origin(env)+'/?login=failed');const profile=await info.json();
   if(!profile.sub||!profile.email||!(profile.email_verified===true||profile.email_verified==='true'))return redirect(origin(env)+'/?login=unverified');
   const email=adminTeacherEmail(profile.email),sub=String(profile.sub),name=String(profile.name||email).slice(0,180);
   await env.DB.prepare("INSERT INTO users(sub,email,name,updated_at) VALUES(?,?,?,datetime('now')) ON CONFLICT(sub) DO UPDATE SET email=excluded.email,name=excluded.name,updated_at=datetime('now')").bind(sub,email,name).run();
   const session=rnd(),sessionHash=await sha256(session);await env.DB.prepare('INSERT INTO sessions(id_hash,user_sub,expires_at) VALUES(?,?,?)').bind(sessionHash,sub,now()+7*86400).run();
   return redirect(origin(env)+'/',{'Set-Cookie':cookie(SESSION_COOKIE,session,7*86400)});
  }
  // Only same-origin JSON writes may mutate personal data.
  if(!['GET','HEAD'].includes(request.method)){const reqOrigin=request.headers.get('Origin');if(!reqOrigin||reqOrigin!==url.origin)return fail('Origin permintaan tidak sah.',403);}
  const user=await userFor(request,env);
  if(path==='portal/event'&&request.method==='GET'){
   const row=await env.DB.prepare('SELECT content_json,enabled,version FROM portal_event WHERE id=1').first();
   return JSON_RESPONSE({event:row?.enabled?JSON.parse(row.content_json):null});
  }
  if(path==='admin/event'&&request.method==='GET'){
   requireRole(user,'admin');const row=await env.DB.prepare('SELECT content_json,enabled,version FROM portal_event WHERE id=1').first();
   return JSON_RESPONSE({event:JSON.parse(row.content_json),enabled:!!row.enabled,version:row.version});
  }
  if(path==='admin/event'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),v=b.event;
   if(!v||typeof v!=='object'||typeof b.enabled!=='boolean'||!Number.isSafeInteger(b.version)||b.version<0)return fail('Format maklumat majlis tidak sah.');
   const limits={title:120,date:10,time:5,venue:250,dresscode:200,schedule:6000,guidance:3000},data={};
   for(const [key,max] of Object.entries(limits)){if(typeof v[key]!=='string'||v[key].length>max)return fail('Medan '+key+' tidak sah atau terlalu panjang.');data[key]=v[key].trim();}
   if(data.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!Number.isFinite(Date.parse(data.date+'T00:00:00Z'))||new Date(data.date+'T00:00:00Z').toISOString().slice(0,10)!==data.date))return fail('Tarikh majlis tidak sah.');
   if(data.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))return fail('Masa majlis tidak sah.');
   if(b.enabled&&(!data.title||!data.date||!data.time||!data.venue))return fail('Isi tajuk, tarikh, masa dan tempat sebelum menerbitkan.');
   const saved=await env.DB.prepare('UPDATE portal_event SET content_json=?,enabled=?,version=version+1 WHERE id=1 AND version=?').bind(JSON.stringify(data),b.enabled?1:0,b.version).run();
   if(!saved.meta.changes)return fail('Maklumat majlis telah diubah oleh admin lain. Muat semula dahulu.',409);
   return JSON_RESPONSE({ok:true,version:b.version+1});
  }
  if(path==='portal/announcement'&&request.method==='GET'){
   const row=await env.DB.prepare('SELECT title,body,enabled,version,updated_at FROM portal_announcement WHERE id=1').first();
   return JSON_RESPONSE({announcement:row?.enabled?{title:row.title,body:row.body,updatedAt:row.updated_at}:null});
  }
  if(path==='admin/announcement'&&request.method==='GET'){
   requireRole(user,'admin');const row=await env.DB.prepare('SELECT title,body,enabled,version FROM portal_announcement WHERE id=1').first();
   return JSON_RESPONSE({title:row.title,body:row.body,enabled:!!row.enabled,version:row.version});
  }
  if(path==='admin/announcement'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request);
   if(typeof b.title!=='string'||typeof b.body!=='string'||typeof b.enabled!=='boolean'||!Number.isSafeInteger(b.version)||b.version<0)return fail('Format pengumuman tidak sah.');
   const title=b.title.trim(),body=b.body.trim();
   if(title.length>120||body.length>3000||(b.enabled&&(!title||!body)))return fail('Isi tajuk (maksimum 120 aksara) dan mesej (maksimum 3000 aksara) sebelum menerbitkan.');
   const saved=await env.DB.prepare('UPDATE portal_announcement SET title=?,body=?,enabled=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND version=?').bind(title,body,b.enabled?1:0,b.version).run();
   if(!saved.meta.changes)return fail('Pengumuman telah diubah oleh admin lain. Muat semula sebelum menyunting.',409);
   return JSON_RESPONSE({ok:true,version:b.version+1});
  }
  if(path==='me'&&request.method==='GET')return JSON_RESPONSE(user?{authenticated:true,user}:{authenticated:false});
  if(path==='logout'&&request.method==='POST'){const sid=cookies(request)[SESSION_COOKIE];if(sid)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(sid)).run();return JSON_RESPONSE({ok:true},200,{'Set-Cookie':cookie(SESSION_COOKIE,'',0)});}
  if(!user)return fail('Sila log masuk menggunakan Google.',401);
  if(path==='published'&&request.method==='GET'){
   const r=await env.DB.prepare('SELECT p.class_id,p.snapshot_json,p.published_at,c.year,c.name AS class_name FROM publications p JOIN classes c ON c.id=p.class_id WHERE c.year BETWEEN 1 AND 5 ORDER BY c.year,c.name').all();
   return JSON_RESPONSE({categories:CATEGORIES,classes:(r.results||[]).map(x=>({classId:x.class_id,year:x.year,className:x.class_name,publishedAt:x.published_at,awards:Object.fromEntries(Object.entries(JSON.parse(x.snapshot_json)).filter(([id])=>{const cat=CATEGORIES.find(c=>c.id===id);return cat&&(!cat.years||cat.years.includes(x.year));}))}))});
  }
  if(path==='teacher/class'&&request.method==='GET'){
   requireRole(user,'teacher');const cls=await env.DB.prepare('SELECT id,year,name,status,updated_at,submitted_at FROM classes WHERE id=?').bind(user.classId).first();
   const d=await env.DB.prepare('SELECT category_id,names_json,version FROM drafts WHERE class_id=? AND category_id=?').bind(user.classId,'pbd').all();
   const n=await env.DB.prepare('SELECT category_id,names_json,version FROM nominations WHERE class_id=?').bind(user.classId).all();
   const categories=CATEGORIES.filter(c=>c.teacher&&(!c.years||c.years.includes(cls.year))),allowed=new Set(categories.map(c=>c.id));
   return JSON_RESPONSE({class:cls,categories,drafts:Object.fromEntries([...(d.results||[]),...(n.results||[])].filter(x=>allowed.has(x.category_id)).map(x=>[x.category_id,{names:JSON.parse(x.names_json),version:x.version}]))});
  }

  if(path==='teacher/save'&&request.method==='POST'){
   requireRole(user,'teacher');const input=await reqBody(request);const cls=await env.DB.prepare('SELECT year,status FROM classes WHERE id=?').bind(user.classId).first();
   if(cls?.status!=='draft')return fail('Senarai telah dihantar. Minta urus setia membuka semula.',423);
   const cat=categoryOf(input.categoryId,cls.year,true);if(!cat)return fail('Kategori tidak dibenarkan.',403);const list=names(input.names);
   if(cat.classLimit&&list.length>cat.classLimit)return fail('PBD: maksimum 5 murid setiap kelas.');
   return JSON_RESPONSE(await saveDraft(env,user.classId,input.categoryId,Number(input.version),list,cat.nomination?'nominations':'drafts'));
  }
  if(path==='teacher/submit'&&request.method==='POST'){
   requireRole(user,'teacher');await reqBody(request);const row=await env.DB.prepare('SELECT names_json FROM drafts WHERE class_id=? AND category_id=?').bind(user.classId,'pbd').first();
   if(JSON.parse(row?.names_json||'[]').length!==5)return fail('PBD: isi tepat 5 nama murid sebelum menghantar senarai akhir.');
   const r=await env.DB.prepare("UPDATE classes SET status='submitted',submitted_at=datetime('now'),updated_at=datetime('now') WHERE id=? AND status='draft'").bind(user.classId).run();
   return r.meta?.changes?JSON_RESPONSE({ok:true}):fail('Senarai sudah dihantar.',409);
  }
  if(path==='work/overview'&&request.method==='GET'){
   const categories=CATEGORIES.filter(c=>c.id!=='pbd'&&canWork(user,c.id,url.searchParams.get('scope')==='mine'));if(!categories.length)return fail('Tiada tugasan kategori diberikan.',403);
   const classes=(await env.DB.prepare('SELECT id,year,name,status FROM classes WHERE year BETWEEN 1 AND 5 ORDER BY year,name').all()).results||[];
   return JSON_RESPONSE({categories,classes});
  }
  if(path==='work/class'&&request.method==='GET'){
   const id=validateClassId(url.searchParams.get('classId')),cls=await env.DB.prepare('SELECT id,year,name,status FROM classes WHERE id=?').bind(id).first();
   const cat=cls&&categoryOf(url.searchParams.get('categoryId'),cls.year,false);if(!cat||!canWork(user,cat.id,url.searchParams.get('scope')==='mine'))return fail('Kategori ini bukan tugasan anda.',403);
   return JSON_RESPONSE(await workData(env,cls,cat));
  }
  if(path==='work/save'&&request.method==='POST')return JSON_RESPONSE(await saveFinal(env,user,await reqBody(request),url.searchParams.get('scope')==='mine'));
  if(path==='admin/category-assignments'&&request.method==='GET'){
   requireRole(user,'admin');return JSON_RESPONSE({assignments:(await env.DB.prepare('SELECT email,category_id,assigned_by FROM category_assignments ORDER BY email,category_id').all()).results||[],categories:CATEGORIES.filter(c=>c.id!=='pbd')});
  }
  if(path==='admin/category-assignments'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email);
   const ids=b.categoryIds;if(!Array.isArray(ids)||!ids.length||ids.length>CATEGORIES.length-1||new Set(ids).size!==ids.length||ids.some(id=>!CATEGORIES.some(c=>c.id===id&&c.id!=='pbd')))return fail('Pilih tugasan kategori yang sah.');
   for(const id of ids)await env.DB.prepare("INSERT INTO category_assignments(email,category_id,assigned_by) VALUES(?,?,?) ON CONFLICT(email,category_id) DO UPDATE SET assigned_by=excluded.assigned_by,updated_at=datetime('now')").bind(email,id,user.email).run();
   return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/category-assignments/revoke'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email);
   if(typeof b.categoryId!=='string')return fail('Kategori tidak sah.');await env.DB.prepare('DELETE FROM category_assignments WHERE email=? AND category_id=?').bind(email,b.categoryId).run();return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/admins'&&request.method==='GET'){
   requireRole(user,'admin');const grants=await env.DB.prepare('SELECT email,granted_by,created_at FROM admin_grants ORDER BY email').all();
   const fixed=adminEmails(env);return JSON_RESPONSE({admins:[...Array.from(fixed,email=>({email,protected:true})),...(grants.results||[]).filter(a=>!fixed.has(a.email)).map(a=>({...a,protected:false}))]});
  }
  if(path==='admin/admins'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email);
   if(await isAdminEmail(env,email))return fail('Akaun ini sudah menjadi pentadbir.',409);
   const result=await env.DB.prepare('INSERT OR IGNORE INTO admin_grants(email,granted_by) VALUES(?,?)').bind(email,user.email).run();
   return result.meta?.changes?JSON_RESPONSE({ok:true}):fail('Akaun ini sudah menjadi pentadbir.',409);
  }
  if(path==='admin/admins/revoke'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email);
   if(adminEmails(env).has(email))return fail('Pentadbir utama dilindungi. Ubah konfigurasi Cloudflare untuk menguruskannya.',403);
   if(email===user.email)return fail('Anda tidak boleh membatalkan akses sendiri.',409);
   const result=await env.DB.prepare('DELETE FROM admin_grants WHERE email=?').bind(email).run();
   return result.meta?.changes?JSON_RESPONSE({ok:true}):fail('Pentadbir tidak ditemui.',404);
  }
  if(path==='admin/overview'&&request.method==='GET'){requireRole(user,'admin');return JSON_RESPONSE(await overview(env));}
  if(path==='admin/class'&&request.method==='GET'){
   requireRole(user,'admin');const id=validateClassId(url.searchParams.get('id'));
   const [cls,drafts]=await Promise.all([env.DB.prepare('SELECT c.id,c.year,c.name,c.status,p.published_at FROM classes c LEFT JOIN publications p ON p.class_id=c.id WHERE c.id=?').bind(id).first(),env.DB.prepare('SELECT category_id,names_json,version FROM drafts WHERE class_id=?').bind(id).all()]);
   if(!cls)return fail('Kelas tidak ditemui.',404);
   return JSON_RESPONSE({class:cls,categories:CATEGORIES.filter(c=>!c.years||c.years.includes(cls.year)),drafts:Object.fromEntries((drafts.results||[]).map(x=>[x.category_id,{names:JSON.parse(x.names_json),version:x.version}]))});
  }
  if(path==='admin/assign'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email),id=validateClassId(b.classId);
   const cls=await env.DB.prepare('SELECT id FROM classes WHERE id=?').bind(id).first();if(!cls)return fail('Kelas tidak ditemui.',404);
   await env.DB.prepare('INSERT INTO teacher_assignments(email,class_id,updated_at) VALUES(?,?,datetime(\'now\')) ON CONFLICT(email) DO UPDATE SET class_id=excluded.class_id,updated_at=datetime(\'now\')').bind(email,id).run();
   return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/unassign'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email);
   await env.DB.prepare('DELETE FROM teacher_assignments WHERE email=?').bind(email).run();return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/class/status'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId);
   if(!['draft','submitted'].includes(b.status))return fail('Status tidak sah.');
   // Reopening a class automatically retracts any published snapshot.
   if(b.status==='draft')await env.DB.prepare('DELETE FROM publications WHERE class_id=?').bind(id).run();
   const r=await env.DB.prepare("UPDATE classes SET status=?,submitted_at=CASE WHEN ?='submitted' THEN datetime('now') ELSE NULL END,updated_at=datetime('now') WHERE id=?").bind(b.status,b.status,id).run();
   return r.meta?.changes?JSON_RESPONSE({ok:true}):fail('Kelas tidak ditemui.',404);
  }
  if(path==='admin/special/save'&&request.method==='POST'){
   requireRole(user,'admin');return JSON_RESPONSE(await saveFinal(env,user,await reqBody(request)));
  }

  if(path==='admin/publish'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId);
   const cls=await env.DB.prepare('SELECT id,year,status FROM classes WHERE id=?').bind(id).first();if(!cls)return fail('Kelas tidak ditemui.',404);
   if(cls.status!=='submitted')return fail('Guru perlu menghantar senarai akhir sebelum penerbitan.',409);
   const d=await env.DB.prepare('SELECT category_id,names_json,version FROM drafts WHERE class_id=?').bind(id).all();const snapshot={};
   for(const item of d.results||[]){const cat=CATEGORIES.find(x=>x.id===item.category_id);if(!cat||(cat.years&&!cat.years.includes(cls.year)))continue;const n=JSON.parse(item.names_json);if(!n.length)continue;
    if(cat.id==='pbd'&&n.length!==5)return fail('PBD mesti mempunyai tepat 5 penerima sebelum diterbitkan.',409);
    if(cat.nomination||cat.id==='mawar'){const review=await env.DB.prepare('SELECT version FROM final_reviews WHERE class_id=? AND category_id=?').bind(id,cat.id).first();if(review?.version!==item.version)return fail('Semak dan sahkan L/P bagi '+cat.name+' melalui Pemilihan & pengisian dahulu.',409);}
    const limit=cat.scope==='year'?cat.quota?.[cls.year]:cat.quota;
    if(limit!=null){const all=await env.DB.prepare('SELECT class_id,names_json FROM drafts WHERE category_id=?').bind(cat.id).all();const count=(all.results||[]).filter(r=>(!cat.years||cat.years.includes(+r.class_id[0]))&&(cat.scope!=='year'||+r.class_id[0]===cls.year)).reduce((s,r)=>s+JSON.parse(r.names_json).length,0);if(count>limit)return fail('Kuota keseluruhan '+cat.name+' melebihi '+limit+' penerima.',409);}
    snapshot[item.category_id]=n;
   }
   if(!Object.keys(snapshot).length)return fail('Tiada nama penerima untuk diterbitkan.');
   await env.DB.prepare('INSERT INTO publications(class_id,snapshot_json,published_at,published_by) VALUES(?,?,datetime(\'now\'),?) ON CONFLICT(class_id) DO UPDATE SET snapshot_json=excluded.snapshot_json,published_at=datetime(\'now\'),published_by=excluded.published_by').bind(id,JSON.stringify(snapshot),user.email).run();
   return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/unpublish'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId);
   await env.DB.prepare('DELETE FROM publications WHERE class_id=?').bind(id).run();return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/export'&&request.method==='GET'){requireRole(user,'admin');const format=url.searchParams.get('format')||'csv';if(!['csv','json'].includes(format))return fail('Format laporan tidak sah.');const data=await exportReportData(env,url);return format==='json'?JSON_RESPONSE(data):exportCSV(data);}
  return fail('Laluan API tidak wujud.',404);
 }catch(err){if(err.status)return fail(err.message,err.status);console.error('MaPeM API failure:',err);if(/no such table|D1_ERROR/i.test(err.message||''))return fail('Database belum lengkap. Jalankan semua migrasi aplikasi terkini.',503);return fail('Ralat pelayan. Cuba lagi atau hubungi urus setia.',500);}
}

