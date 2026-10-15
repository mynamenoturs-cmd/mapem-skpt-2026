// MaPeM 2026: same-origin Google OAuth, server-side sessions, explicit RBAC.
// Teacher edits are scoped to the class assigned to their verified Google email.
export const CATEGORIES = [
  {id:'pbd',name:'Anugerah Pencapaian PBD Terbaik',scope:'year',quota:{1:45,2:45,3:40},teacher:true},
  {id:'uasa',name:'Anugerah 10 Pencapaian Terbaik (UASA)',scope:'year',quota:{1:10,2:10,3:10},teacher:true},
  {id:'matapelajaran',name:'Anugerah Pencapaian Mata Pelajaran Terbaik',scope:'year',quota:{1:30,2:30,3:30},teacher:true},
  {id:'plan',name:'Anugerah Khas PLAN',scope:'year',quota:{1:null,2:null,3:null},teacher:true},
  {id:'cemara',name:'Anugerah Ikon Cemara Tahap 1 (L/P)',scope:'total',quota:2,teacher:false},
  {id:'kurikulum',name:'Anugerah Khas Kurikulum Tahap 1 (L/P)',scope:'total',quota:2,teacher:false},
  {id:'kokurikulum',name:'Harapan Kokurikulum Tahap 1 (L/P)',scope:'total',quota:2,teacher:false},
  {id:'hem',name:'Harapan HEM (L/P)',scope:'total',quota:2,teacher:false},
  {id:'ains',name:'AINS NILAM — Hamper Individu',scope:'year',quota:{1:18,2:18,3:16},teacher:true},
  {id:'ains-tokoh',name:'Tokoh AINS NILAM 2026 — Tahap 1',scope:'total',quota:3,teacher:false},
  {id:'delima',name:'Ikon Navigator DELIMa',scope:'year',quota:{1:null,2:null,3:null},teacher:true},
  {id:'mawar',name:'Anugerah Tokoh Murid Mawar (L/P)',scope:'year',quota:{3:2},years:[3],teacher:false}
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
function origin(env){return String(env.APP_ORIGIN||'').replace(/\/$/,'');}
function getConfig(env){return !!(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && /^https:\/\/[^/]+$/.test(origin(env)) && adminEmails(env).size>0);}
function googleCallback(env){return origin(env)+'/api/auth/google/callback';}
function safeError(message,status=400){const e=new Error(message);e.status=status;throw e;}
async function reqBody(request){if(!request.headers.get('content-type')?.includes('application/json'))safeError('Permintaan mesti menggunakan JSON.',415);const t=await request.text();if(t.length>65536)safeError('Data terlalu besar.',413);try{return JSON.parse(t)}catch{safeError('Format JSON tidak sah.')}}
function names(input){if(!Array.isArray(input)||input.length>150)safeError('Maksimum 150 nama bagi satu kategori.');const list=input.map(x=>String(x||'').trim().replace(/\s+/g,' ')).filter(Boolean);if(list.some(x=>x.length<2||x.length>160||/[<>]/.test(x)))safeError('Nama mesti 2–160 aksara dan tanpa simbol HTML.');if(new Set(list.map(x=>x.toLocaleLowerCase('ms'))).size!==list.length)safeError('Terdapat nama berulang dalam kategori.');return list;}
async function userFor(request,env){const sid=cookies(request)[SESSION_COOKIE];if(!sid||!/^[a-f0-9]{64}$/.test(sid))return null;const hash=await sha256(sid);
 const user=await env.DB.prepare('SELECT u.sub,u.email,u.name,s.expires_at FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(hash,now()).first();
 if(!user)return null;const email=user.email.toLowerCase();const isAdmin=adminEmails(env).has(email);
 const assignment=isAdmin?null:await env.DB.prepare('SELECT a.class_id,c.year,c.name AS class_name FROM teacher_assignments a JOIN classes c ON c.id=a.class_id WHERE a.email=?').bind(email).first();
 return {sub:user.sub,email,name:user.name,role:isAdmin?'admin':assignment?'teacher':'viewer',classId:assignment?.class_id||null,className:assignment?`${assignment.year} ${assignment.class_name}`:null};}
function requireRole(user,role){if(!user)safeError('Sila log masuk dengan akaun Google.',401);if(role==='admin'&&user.role!=='admin')safeError('Akses pentadbir sahaja.',403);if(role==='teacher'&&user.role!=='teacher')safeError('Akses guru kelas sahaja.',403);}
function categoryOf(id,year,teacher){return CATEGORIES.find(c=>c.id===id&&c.teacher===teacher&&(!c.years||c.years.includes(year)));}
async function saveDraft(env,classId,categoryId,version,list){if(!Number.isSafeInteger(version)||version<0)safeError('Versi simpanan tidak sah.');
 const current=await env.DB.prepare('SELECT version FROM drafts WHERE class_id=? AND category_id=?').bind(classId,categoryId).first();
 if((current?.version??0)!==version)safeError('Data telah diubah di peranti lain. Muat semula sebelum menyimpan.',409);
 const sql='INSERT INTO drafts(class_id,category_id,names_json,version,updated_at) VALUES(?,?,?,1,datetime(\'now\')) ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json, version=drafts.version+1,updated_at=datetime(\'now\') WHERE drafts.version=?';
 const result=await env.DB.prepare(sql).bind(classId,categoryId,JSON.stringify(list),version).run();
 if(result.meta?.changes!==1)safeError('Versi simpanan berubah. Muat semula sebelum menyimpan.',409);
 await env.DB.prepare('UPDATE classes SET updated_at=datetime(\'now\') WHERE id=?').bind(classId).run();
 return {ok:true,version:version+1,total:list.length};}
async function overview(env){const [classes,drafts,assignments,publications]=await Promise.all([
 env.DB.prepare('SELECT id,year,name,status,submitted_at,updated_at FROM classes ORDER BY year,name').all(),
 env.DB.prepare('SELECT class_id,category_id,names_json,version FROM drafts').all(),
 env.DB.prepare('SELECT email,class_id FROM teacher_assignments ORDER BY class_id').all(),
 env.DB.prepare('SELECT class_id,published_at FROM publications').all()]);
 const counts={};const quota={};for(const row of drafts.results||[]){const n=JSON.parse(row.names_json).length;counts[row.class_id]=(counts[row.class_id]||0)+n;const year=+row.class_id[0];quota[row.category_id]??={};quota[row.category_id][year]=(quota[row.category_id][year]||0)+n;}
 const pub=new Map((publications.results||[]).map(x=>[x.class_id,x.published_at]));
 return {classes:(classes.results||[]).map(x=>({...x,total:counts[x.id]||0,publishedAt:pub.get(x.id)||null})),assignments:assignments.results||[],categories:CATEGORIES,quota};}
function csvEscape(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
async function exportCSV(env){const [cls,rows]=await Promise.all([env.DB.prepare('SELECT id,year,name,status FROM classes').all(),env.DB.prepare('SELECT class_id,category_id,names_json FROM drafts').all()]);const lookup=new Map((cls.results||[]).map(c=>[c.id,c])),cat=new Map(CATEGORIES.map(c=>[c.id,c.name]));const body=[['Tahun','Kelas','Kategori','Bil','Nama Penuh Murid','Status']];for(const r of rows.results||[]){const c=lookup.get(r.class_id);if(c)JSON.parse(r.names_json).forEach((name,i)=>body.push([c.year,`${c.year} ${c.name}`,cat.get(r.category_id)||r.category_id,i+1,name,c.status]));}
 return new Response('\uFEFF'+body.map(a=>a.map(csvEscape).join(',')).join('\r\n'),{headers:{'content-type':'text/csv;charset=utf-8','content-disposition':'attachment; filename=mapem-skpt-2026.csv','cache-control':'no-store','x-content-type-options':'nosniff'}});}
function validateClassId(v){if(typeof v!=='string'||!/^[123]-(amber|crystal|diamond|emerald|jade|pearl|ruby|sapphire|topaz)$/.test(v)||v==='3-amber')safeError('Kelas tidak sah.');return v;}
function adminTeacherEmail(v){const value=String(v||'').trim().toLowerCase();if(value.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))safeError('Alamat e-mel guru tidak sah.');return value;}
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
  if(path==='me'&&request.method==='GET')return JSON_RESPONSE(user?{authenticated:true,user}:{authenticated:false});
  if(path==='logout'&&request.method==='POST'){const sid=cookies(request)[SESSION_COOKIE];if(sid)await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(sid)).run();return JSON_RESPONSE({ok:true},200,{'Set-Cookie':cookie(SESSION_COOKIE,'',0)});}
  if(!user)return fail('Sila log masuk menggunakan Google.',401);
  if(path==='published'&&request.method==='GET'){
   const r=await env.DB.prepare('SELECT p.class_id,p.snapshot_json,p.published_at,c.year,c.name AS class_name FROM publications p JOIN classes c ON c.id=p.class_id ORDER BY c.year,c.name').all();
   return JSON_RESPONSE({categories:CATEGORIES,classes:(r.results||[]).map(x=>({classId:x.class_id,year:x.year,className:x.class_name,publishedAt:x.published_at,awards:JSON.parse(x.snapshot_json)}))});
  }
  if(path==='teacher/class'&&request.method==='GET'){
   requireRole(user,'teacher');const cls=await env.DB.prepare('SELECT id,year,name,status,updated_at,submitted_at FROM classes WHERE id=?').bind(user.classId).first();
   const drafts=await env.DB.prepare('SELECT category_id,names_json,version FROM drafts WHERE class_id=?').bind(user.classId).all();
   return JSON_RESPONSE({class:cls,categories:CATEGORIES.filter(c=>c.teacher&&(!c.years||c.years.includes(cls.year))),drafts:Object.fromEntries((drafts.results||[]).map(x=>[x.category_id,{names:JSON.parse(x.names_json),version:x.version}]))});
  }
  if(path==='teacher/save'&&request.method==='POST'){
   requireRole(user,'teacher');const input=await reqBody(request);const cls=await env.DB.prepare('SELECT year,status FROM classes WHERE id=?').bind(user.classId).first();
   if(cls?.status!=='draft')return fail('Senarai telah dihantar. Minta urus setia membuka semula.',423);
   if(!categoryOf(input.categoryId,cls.year,true))return fail('Kategori tidak dibenarkan.',403);
   return JSON_RESPONSE(await saveDraft(env,user.classId,input.categoryId,Number(input.version),names(input.names)));
  }
  if(path==='teacher/submit'&&request.method==='POST'){
   requireRole(user,'teacher');await reqBody(request);const row=await env.DB.prepare('SELECT COUNT(*) AS n FROM drafts WHERE class_id=? AND names_json!=?').bind(user.classId,'[]').first();
   if(!row?.n)return fail('Isi sekurang-kurangnya satu nama dahulu.');
   const r=await env.DB.prepare("UPDATE classes SET status='submitted',submitted_at=datetime('now'),updated_at=datetime('now') WHERE id=? AND status='draft'").bind(user.classId).run();
   return r.meta?.changes?JSON_RESPONSE({ok:true}):fail('Senarai sudah dihantar.',409);
  }
  if(path==='admin/overview'&&request.method==='GET'){requireRole(user,'admin');return JSON_RESPONSE(await overview(env));}
  if(path==='admin/class'&&request.method==='GET'){
   requireRole(user,'admin');const id=validateClassId(url.searchParams.get('id'));
   const [cls,drafts]=await Promise.all([env.DB.prepare('SELECT id,year,name,status FROM classes WHERE id=?').bind(id).first(),env.DB.prepare('SELECT category_id,names_json,version FROM drafts WHERE class_id=?').bind(id).all()]);
   if(!cls)return fail('Kelas tidak ditemui.',404);
   return JSON_RESPONSE({class:cls,categories:CATEGORIES.filter(c=>!c.years||c.years.includes(cls.year)),drafts:Object.fromEntries((drafts.results||[]).map(x=>[x.category_id,{names:JSON.parse(x.names_json),version:x.version}]))});
  }
  if(path==='admin/assign'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),email=adminTeacherEmail(b.email),id=validateClassId(b.classId);
   if(adminEmails(env).has(email))return fail('Gunakan akaun bukan admin untuk guru kelas.');
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
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId),cls=await env.DB.prepare('SELECT year FROM classes WHERE id=?').bind(id).first();
   if(!cls||!categoryOf(b.categoryId,cls.year,false))return fail('Kategori khas tidak sah.',403);
   return JSON_RESPONSE(await saveDraft(env,id,b.categoryId,Number(b.version),names(b.names)));
  }
  if(path==='admin/publish'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId);
   const cls=await env.DB.prepare('SELECT id,status FROM classes WHERE id=?').bind(id).first();if(!cls)return fail('Kelas tidak ditemui.',404);
   if(cls.status!=='submitted')return fail('Guru perlu menghantar senarai akhir sebelum penerbitan.',409);
   const d=await env.DB.prepare('SELECT category_id,names_json FROM drafts WHERE class_id=?').bind(id).all();const snapshot={};
   for(const item of d.results||[])if(CATEGORIES.some(x=>x.id===item.category_id)){const n=JSON.parse(item.names_json);if(n.length)snapshot[item.category_id]=n;}
   if(!Object.keys(snapshot).length)return fail('Tiada nama penerima untuk diterbitkan.');
   await env.DB.prepare('INSERT INTO publications(class_id,snapshot_json,published_at,published_by) VALUES(?,?,datetime(\'now\'),?) ON CONFLICT(class_id) DO UPDATE SET snapshot_json=excluded.snapshot_json,published_at=datetime(\'now\'),published_by=excluded.published_by').bind(id,JSON.stringify(snapshot),user.email).run();
   return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/unpublish'&&request.method==='POST'){
   requireRole(user,'admin');const b=await reqBody(request),id=validateClassId(b.classId);
   await env.DB.prepare('DELETE FROM publications WHERE class_id=?').bind(id).run();return JSON_RESPONSE({ok:true});
  }
  if(path==='admin/export'&&request.method==='GET'){requireRole(user,'admin');return exportCSV(env);}
  return fail('Laluan API tidak wujud.',404);
 }catch(err){if(err.status)return fail(err.message,err.status);console.error('MaPeM API failure:',err);if(/no such table|D1_ERROR/i.test(err.message||''))return fail('Database belum mempunyai migrasi 0002_google_pwa.sql atau jadual asas.',503);return fail('Ralat pelayan. Cuba lagi atau hubungi urus setia.',500);}
}
