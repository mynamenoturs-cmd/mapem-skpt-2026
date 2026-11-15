// Pendaftaran Tahun 1 2027 — D1 API. Import only from authenticated MaPeM Pages Function.
// Do not serve student PII to public viewers or users without explicit class grants.
const CLASSES = ['Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl'];
const HEAD = {'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex,nofollow'};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:HEAD});
function error(message,status=400) {const e=new Error(message);e.status=status;throw e;}
function safeText(value,key,max,min=1){
 if(typeof value!=='string')error('Medan '+key+' tidak sah.');
 const s=value.trim().replace(/\r\n/g,'\n');
 if(s.length<min||s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s))error('Panjang/kandungan medan '+key+' tidak sah.');
 return s;
}
function validateRecord(v) {
 if(!v || typeof v!=='object'||Array.isArray(v))error('Rekod murid tidak sah.');
 const kelas=safeText(v.kelas,'Kelas',20);
 if(!CLASSES.includes(kelas))error('Kelas tidak sah.');
 const pra=safeText(v.pra,'PRA',20);
 if(!['Ya','Tidak','Belum Pasti'].includes(pra))error('Pilihan PRA tidak sah.');
 const idMurid=safeText(v.idMurid,'ID murid',45,2);
 if(!/^[\p{L}\p{N} _./-]+$/u.test(idMurid))error('ID murid mengandungi aksara tidak dibenarkan.');
 const noTelefon=safeText(v.noTelefon,'No. telefon',25,7);
 if(!/^[+\d ()-]+$/.test(noTelefon))error('No. telefon tidak sah.');
 return {kelas,pra,idMurid,namaMurid:safeText(v.namaMurid,'Nama murid',150,2),
 namaPenjaga:safeText(v.namaPenjaga,'Nama penjaga',150,2),
 noIc:safeText(v.noIc,'No. IC penjaga',30,4),
 noTelefon,alamat:safeText(v.alamat,'Alamat',500,5)};
}
async function accessFor(env,user) {
 if(user.role==='admin')return {role:'admin',kelas:'Semua'};
 const row=await env.DB.prepare('SELECT class_name AS kelas FROM registration_2027_access WHERE email=?').bind(user.email).first();
 return row ? {role:'editor',kelas:row.kelas} : null;
}
function allowed(access,kelas) {return access.role==='admin'||access.kelas===kelas;}
async function parseBody(request) {
 if(!request.headers.get('content-type')?.includes('application/json'))error('Permintaan mesti JSON.',415);
 const content=await request.text();
 if(content.length>12000)error('Permintaan terlalu besar.',413);
 try {return JSON.parse(content);}catch {error('JSON tidak sah.');}
}
const columns='uid, student_id AS idMurid, class_name AS kelas, name AS namaMurid, pra, guardian_name AS namaPenjaga, guardian_ic AS noIc, guardian_phone AS noTelefon, address AS alamat, version, created_at AS createdAt, updated_at AS updatedAt';
async function audit(env,email,action,uid,kelas) {
 await env.DB.prepare('INSERT INTO registration_2027_audit(actor_email,action,student_uid,class_name) VALUES(?,?,?,?)').bind(email,action,uid,kelas).run();
}
export async function handleRegistration2027({request,env,user,path}) {
 const access=await accessFor(env,user);
 if(path==='registration2027/me'&&request.method==='GET')
  return access?json({authorized:true,user:{email:user.email,name:user.name},...access}):json({authorized:false,error:'Akaun Google belum diberikan akses ke pendaftaran Tahun 1 2027.'},403);
 if(!access)error('Akaun Google tidak mempunyai kebenaran pendaftaran Tahun 1 2027.',403);
 if(path==='registration2027/students'&&request.method==='GET') {
  const query=access.role==='admin'
   ? env.DB.prepare('SELECT '+columns+' FROM registration_2027_students ORDER BY class_name,name LIMIT 5000')
   : env.DB.prepare('SELECT '+columns+' FROM registration_2027_students WHERE class_name=? ORDER BY name LIMIT 5000').bind(access.kelas);
  const rows=(await query.all()).results||[];
  return json({records:rows});
 }
 if(path==='registration2027/students/save'&&request.method==='POST') {
  const b=await parseBody(request),r=validateRecord(b.record);
  if(!allowed(access,r.kelas))error('Anda hanya boleh menyunting kelas yang diberikan.',403);
  const uid=b.uid===null||b.uid===undefined?'':String(b.uid);
  if(uid) {
   if(!/^[a-zA-Z0-9_-]{8,80}$/.test(uid))error('UID murid tidak sah.');
   if(!Number.isSafeInteger(b.version)||b.version<1)error('Versi rekod tidak sah.');
   const old=await env.DB.prepare('SELECT class_name AS kelas,version FROM registration_2027_students WHERE uid=?').bind(uid).first();
   if(!old)error('Rekod tidak dijumpai.',404);
   if(!allowed(access,old.kelas))error('Rekod kelas lain tidak dibenarkan.',403);
   if(old.version!==b.version)error('Rekod telah diubah pengguna lain. Muat semula.',409);
   try{
    const done=await env.DB.prepare("UPDATE registration_2027_students SET student_id=?,class_name=?,name=?,pra=?,guardian_name=?,guardian_ic=?,guardian_phone=?,address=?,version=version+1,updated_at=CURRENT_TIMESTAMP,updated_by=? WHERE uid=? AND version=?")
     .bind(r.idMurid,r.kelas,r.namaMurid,r.pra,r.namaPenjaga,r.noIc,r.noTelefon,r.alamat,user.email,uid,b.version).run();
    if(done.meta?.changes!==1)error('Rekod diubah di peranti lain. Muat semula.',409);
   }catch(e){if(/UNIQUE constraint failed/i.test(e.message||''))error('ID murid telah didaftarkan.',409);throw e;}
   await audit(env,user.email,'update',uid,r.kelas);
   return json({ok:true,uid,version:b.version+1});
  }
  const newUid=crypto.randomUUID();
  try{
   await env.DB.prepare('INSERT INTO registration_2027_students(uid,student_id,class_name,name,pra,guardian_name,guardian_ic,guardian_phone,address,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .bind(newUid,r.idMurid,r.kelas,r.namaMurid,r.pra,r.namaPenjaga,r.noIc,r.noTelefon,r.alamat,user.email).run();
  }catch(e){if(/UNIQUE constraint failed/i.test(e.message||''))error('ID murid telah didaftarkan.',409);throw e;}
  await audit(env,user.email,'create',newUid,r.kelas);
  return json({ok:true,uid:newUid,version:1},201);
 }
 if(path==='registration2027/students/delete'&&request.method==='POST') {
  const b=await parseBody(request);
  if(typeof b.uid!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(b.uid)||!Number.isSafeInteger(b.version)||b.version<1)error('Permintaan padam tidak sah.');
  const old=await env.DB.prepare('SELECT class_name AS kelas,version FROM registration_2027_students WHERE uid=?').bind(b.uid).first();
  if(!old)error('Rekod tidak dijumpai.',404);
  if(!allowed(access,old.kelas))error('Rekod kelas lain tidak dibenarkan.',403);
  const done=await env.DB.prepare('DELETE FROM registration_2027_students WHERE uid=? AND version=?').bind(b.uid,b.version).run();
  if(done.meta?.changes!==1)error('Rekod diubah pengguna lain. Muat semula.',409);
  await audit(env,user.email,'delete',b.uid,old.kelas);
  return json({ok:true});
 }
 if(path.startsWith('registration2027/access')) {
  if(access.role!=='admin')error('Akses pentadbir sahaja.',403);
  if(path==='registration2027/access'&&request.method==='GET') {
   const rows=(await env.DB.prepare('SELECT email,class_name AS kelas,updated_at AS updatedAt FROM registration_2027_access ORDER BY class_name,email').all()).results||[];
   return json({grants:rows});
  }
  if(path==='registration2027/access/save'&&request.method==='POST') {
   const b=await parseBody(request);
   const email=safeText(b.email,'E-mel',254).toLowerCase(),kelas=safeText(b.kelas,'Kelas',20);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!CLASSES.includes(kelas))error('E-mel atau kelas tidak sah.');
   await env.DB.prepare('INSERT INTO registration_2027_access(email,class_name,granted_by) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET class_name=excluded.class_name,granted_by=excluded.granted_by,updated_at=CURRENT_TIMESTAMP').bind(email,kelas,user.email).run();
   await audit(env,user.email,'grant',null,kelas);
   return json({ok:true});
  }
  if(path==='registration2027/access/revoke'&&request.method==='POST') {
   const b=await parseBody(request);
   const email=safeText(b.email,'E-mel',254).toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))error('E-mel tidak sah.');
   const before=await env.DB.prepare('SELECT class_name AS kelas FROM registration_2027_access WHERE email=?').bind(email).first();
   if(!before)error('Tiada akses untuk e-mel ini.',404);
   await env.DB.prepare('DELETE FROM registration_2027_access WHERE email=?').bind(email).run();
   await audit(env,user.email,'revoke',null,before.kelas);
   return json({ok:true});
  }
 }
 error('Laluan API pendaftaran tidak wujud.',404);
}
