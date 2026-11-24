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
function validateRecord(v, partialImport=false) {
 if(!v || typeof v!=='object'||Array.isArray(v))error('Rekod murid tidak sah.');
 const kelas=safeText(v.kelas,'Kelas',20);
 if(!CLASSES.includes(kelas))error('Kelas tidak sah.');
 const blank=value=>value==null || (typeof value==='string' && !value.trim());
 const detail=(value,label,max,min)=>partialImport && blank(value) ? '' : safeText(value,label,max,min);
 const pra=partialImport && blank(v.pra) ? 'Belum Pasti' : safeText(v.pra,'PRA',20);
 if(!['Ya','Tidak','Belum Pasti'].includes(pra))error('Pilihan PRA tidak sah.');
 const idMurid=safeText(v.idMurid,'ID murid',45,2);
 if(!/^[\p{L}\p{N} _./-]+$/u.test(idMurid))error('ID murid mengandungi aksara tidak dibenarkan.');
 const noTelefon=detail(v.noTelefon,'No. telefon',25,7);
 if(noTelefon && !/^[+\d ()-]+$/.test(noTelefon))error('No. telefon tidak sah.');
 const emailPenjaga=safeText(v.emailPenjaga??'','E-mel penjaga',254,0);
 if(emailPenjaga && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPenjaga))error('E-mel penjaga tidak sah.');
 const agensiPra=safeText(v.agensiPra??'','Agensi prasekolah',40,0);
 if(!['','KEMAS','PASTI','PERPADUAN','PRASEKOLAH KPM','SWASTA','LAIN-LAIN'].includes(agensiPra) || (agensiPra && pra==='Tidak'))error('Agensi prasekolah tidak sah.');
 const demographics={};
 for(const [field,values] of Object.entries({jantina:['Lelaki','Perempuan'],agama:['Muslim','Bukan Muslim'],warga:['Warganegara','Bukan Warganegara']})){
  const value=safeText(v[field]??'',field,40,0);
  if(value && !values.includes(value))error('Pilihan '+field+' tidak sah.');
  demographics[field]=value;
 }
 demographics.bangsa=safeText(v.bangsa??'','Bangsa',80,0);
 return {...demographics,kelas,pra:agensiPra?'Ya':pra,emailPenjaga,agensiPra,idMurid,namaMurid:safeText(v.namaMurid,'Nama murid',150,2),
 namaPenjaga:detail(v.namaPenjaga,'Nama penjaga',150,2),
 noIc:detail(v.noIc,'No. IC penjaga',30,4),
 noTelefon,alamat:detail(v.alamat,'Alamat',500,5)};
}
async function accessFor(env,user) {
 const extra=await env.DB.prepare('SELECT role FROM registration_2027_admins WHERE email=?').bind(user.email).first();
 if(extra?.role==='viewer')return {role:'viewer',kelas:'Semua',canManageAdmins:false};
 if(user.role==='admin')return {role:'admin',kelas:'Semua',canManageAdmins:true};
 if(extra)return {role:'admin',kelas:'Semua',canManageAdmins:false};
 const row=await env.DB.prepare('SELECT class_name AS kelas FROM registration_2027_access WHERE email=?').bind(user.email).first();
 return row ? {role:'editor',kelas:row.kelas} : null;
}
function allowed(access,kelas) {return access.role==='admin'||access.kelas===kelas;}
function emailValue(value){const email=safeText(value,'E-mel',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))error('Alamat e-mel tidak sah.');return email;}
async function parseBody(request,limit=12000) {
 if(!request.headers.get('content-type')?.includes('application/json'))error('Permintaan mesti JSON.',415);
 const content=await request.text();
 if(content.length>limit)error('Permintaan terlalu besar.',413);
 try {return JSON.parse(content);}catch {error('JSON tidak sah.');}
}
const columns='uid, student_id AS idMurid, class_name AS kelas, name AS namaMurid, pra, guardian_name AS namaPenjaga, guardian_ic AS noIc, guardian_phone AS noTelefon, address AS alamat, guardian_email AS emailPenjaga, preschool_agency AS agensiPra, jantina, agama, warga, bangsa, version, created_at AS createdAt, updated_at AS updatedAt';
async function audit(env,email,action,uid,kelas) {
 await env.DB.prepare('INSERT INTO registration_2027_audit(actor_email,action,student_uid,class_name) VALUES(?,?,?,?)').bind(email,action,uid,kelas).run();
}
const teacherFields='class_name AS kelas, teacher_name AS namaGuru, photo_data_url AS gambarPasport';
async function listTeachers(env) {
 const rows=(await env.DB.prepare('SELECT '+teacherFields+' FROM registration_2027_teachers ORDER BY CASE class_name WHEN \'Emerald\' THEN 1 WHEN \'Ruby\' THEN 2 WHEN \'Sapphire\' THEN 3 WHEN \'Diamond\' THEN 4 WHEN \'Jade\' THEN 5 WHEN \'Crystal\' THEN 6 WHEN \'Topaz\' THEN 7 WHEN \'Amber\' THEN 8 ELSE 9 END').all()).results||[];
 return rows;
}
function validateTeacherImage(value) {
 if(value===null||value==='')return null;
 if(typeof value!=='string'||value.length>820000)error('Gambar pasport terlalu besar. Had maksimum 600 KB selepas pemprosesan.',413);
 const match=/^data:image\/(webp|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match)error('Format gambar mesti JPG atau WebP.');
 // Do not decode 250–600 KB in a Workers Free request: check length and
 // magic bytes using only the first 32 base64 characters. D1 stores base64 as text.
 const base64=match[2];
 if(base64.length%4!==0)error('Data gambar tidak lengkap.');
 const padding=base64.endsWith('==')?2:base64.endsWith('=')?1:0;
 const byteCount=base64.length/4*3-padding;
 if(byteCount<350||byteCount>600000)error('Gambar pasport mesti antara 350 B dan 600 KB.',413);
 let header;
 try{header=atob(base64.slice(0,32));}catch{error('Data gambar tidak sah.');}
 if(match[1]==='webp'&&!(header.slice(0,4)==='RIFF'&&header.slice(8,12)==='WEBP'))error('Fail WebP tidak sah.');
 if(match[1]==='jpeg'&&!(header.charCodeAt(0)===255&&header.charCodeAt(1)===216&&header.charCodeAt(2)===255))error('Fail JPEG tidak sah.');
 return value;
}
function validAdminPhone(value){
 if(value===null||value===undefined||value==='')return '';
 const s=safeText(value,'Telefon admin',24,9);
 if(!/^\+?[0-9 ()-]{8,22}$/.test(s)||s.replace(/\D/g,'').length<9)error('Nombor telefon admin tidak sah.');
 return s;
}
async function sha(value){
 const v=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(v),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function publicRegistration2027({request,env,path}){
 if(path==='public/assistant'&&request.method==='GET'){
  // Only explicitly published general FAQs; never return a pupil or guardian record.
  const [rows,setting,config]=await Promise.all([
   env.DB.prepare('SELECT class_name AS kelas, teacher_name AS namaGuru FROM registration_2027_teachers ORDER BY CASE class_name WHEN \'Emerald\' THEN 1 WHEN \'Ruby\' THEN 2 WHEN \'Sapphire\' THEN 3 WHEN \'Diamond\' THEN 4 WHEN \'Jade\' THEN 5 WHEN \'Crystal\' THEN 6 WHEN \'Topaz\' THEN 7 WHEN \'Amber\' THEN 8 ELSE 9 END').all(),
   env.DB.prepare('SELECT parent_lookup_enabled AS enabled,admin_phone AS phone FROM registration_2027_public_settings WHERE id=1').first(),
   env.DB.prepare('SELECT greeting,faq_json FROM registration_2027_bot_config WHERE id=1').first()
  ]);
  let faqs=[];try{faqs=JSON.parse(config?.faq_json||'[]');}catch{}
  return json({teachers:rows.results||[],canSearchStudents:setting?.enabled===1,adminPhone:setting?.phone||'',
   greeting:config?.greeting||'',faqs:faqs.filter(item=>item.enabled!==false).map(item=>({question:item.question,answer:item.answer}))});
 }
 if(path==='public/teachers'&&request.method==='GET'){
  const [teachers,setting]=await Promise.all([
   listTeachers(env),
   env.DB.prepare('SELECT parent_lookup_enabled AS enabled, admin_phone AS phone FROM registration_2027_public_settings WHERE id=1').first()
  ]);
  return json({teachers,canSearchStudents:setting?.enabled===1,adminPhone:setting?.phone||''});
 }
 if(path==='public/lookup'&&request.method==='GET'){
  const setting=await env.DB.prepare('SELECT parent_lookup_enabled AS enabled FROM registration_2027_public_settings WHERE id=1').first();
  if(setting?.enabled!==1)error('Semakan murid belum dibuka oleh pihak sekolah.',403);
  const q=new URL(request.url).searchParams.get('q')||'';
  if(q.length<4||q.length>80||/[\u0000-\u001f%_]/.test(q))error('Taip sekurang-kurangnya 4 huruf nama anak, maksimum 80 aksara. Tanda khas % dan _ tidak dibenarkan.');
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  const tick=Math.floor(Date.now()/1000/900);
  const token=await sha(tick+'|'+ip);
  await env.DB.prepare('INSERT INTO registration_2027_parent_limits(token,hits,expires_at) VALUES(?,1,?) ON CONFLICT(token) DO UPDATE SET hits=hits+1').bind(token,(tick+1)*900).run();
  const rate=await env.DB.prepare('SELECT hits FROM registration_2027_parent_limits WHERE token=?').bind(token).first();
  if(rate.hits>35)error('Terlalu banyak carian. Cuba semula selepas 15 minit.',429);
  const rows=(await env.DB.prepare('SELECT name AS namaMurid, class_name AS kelas FROM registration_2027_students WHERE name LIKE ? ORDER BY name LIMIT 20').bind('%'+q.trim()+'%').all()).results||[];
  return json({results:rows,limited:rows.length===20});
 }
 error('Laluan paparan ibu bapa tidak wujud.',404);
}

export async function handleRegistration2027({request,env,user,path}) {
 const access=await accessFor(env,user);
 if(path==='registration2027/me'&&request.method==='GET')
  return access?json({authorized:true,user:{email:user.email,name:user.name},...access}):json({authorized:false,error:'Akaun Google belum diberikan akses ke pendaftaran Tahun 1 2027.'},403);
 if(!access)error('Akaun Google tidak mempunyai kebenaran pendaftaran Tahun 1 2027.',403);
 if(access.role==='viewer' && (request.method!=='GET'||!['registration2027/teachers','registration2027/students','registration2027/transfers','registration2027/deletions'].includes(path)))error('Akses pentadbir ini untuk paparan sahaja.',403);
 if(path==='registration2027/teachers'&&request.method==='GET'){
  return json({teachers:await listTeachers(env)});
 }
 if(path==='registration2027/teachers/save'&&request.method==='POST'){
  const b=await parseBody(request,900000),kelas=safeText(b.kelas,'Kelas',20);
  if(!CLASSES.includes(kelas)||!allowed(access,kelas))error('Tiada kebenaran mengurus guru kelas ini.',403);
  const previous=await env.DB.prepare('SELECT teacher_name AS namaGuru,photo_data_url AS gambarPasport FROM registration_2027_teachers WHERE class_name=?').bind(kelas).first();
  if(!previous)error('Kelas tidak dijumpai.',404);
  const name=b.namaGuru===undefined?previous.namaGuru:safeText(b.namaGuru,'Nama guru',150,3);
  if(access.role!=='admin'&&name!==previous.namaGuru)error('Hanya pentadbir boleh mengubah nama guru kelas.',403);
  const photo=b.gambarPasport===undefined?previous.gambarPasport:validateTeacherImage(b.gambarPasport);
  // The update is idempotent. Distinguish an actual D1 write failure from a
  // successful write whose audit log or subsequent UI refresh fails.
  try{
   await env.DB.prepare('UPDATE registration_2027_teachers SET teacher_name=?,photo_data_url=?,updated_at=CURRENT_TIMESTAMP,updated_by=? WHERE class_name=?').bind(name,photo,user.email,kelas).run();
  }catch(e){
   console.error('REG2027_TEACHER_SAVE_D1',e?.cause?.message||e?.message||'unknown');
   error('Gambar belum dapat disimpan ke Cloudflare D1 (kod GURU-D1). Cuba lagi selepas beberapa saat.',503);
  }
  try{
   await env.DB.prepare('INSERT INTO registration_2027_teacher_audit(actor_email,class_name,action) VALUES(?,?,?)').bind(user.email,kelas,photo===null?'clear-photo':'update').run();
  }catch(e){
   // A completed photo save must not be reported as failed because the audit
   // table was temporarily unavailable. Log without attaching image or PII.
   console.error('REG2027_TEACHER_AUDIT',e?.cause?.message||e?.message||'unknown');
  }
  return json({ok:true,kelas,photoSaved:true});
 }
 if(path==='registration2027/bot/config'&&request.method==='GET'){
  if(access.role!=='admin')error('Hanya pentadbir boleh mengurus soalan dan jawapan bot.',403);
  const row=await env.DB.prepare('SELECT greeting,faq_json FROM registration_2027_bot_config WHERE id=1').first();
  let faqs=[];try{faqs=JSON.parse(row?.faq_json||'[]');}catch{}
  return json({greeting:row?.greeting||'',faqs});
 }
 if(path==='registration2027/bot/save'&&request.method==='POST'){
  if(access.role!=='admin')error('Hanya pentadbir boleh mengurus soalan dan jawapan bot.',403);
  const body=await parseBody(request,26000);
  const greeting=safeText(body.greeting,'Ucapan Delima PTG BOT',650,40);
  if(!Array.isArray(body.faqs)||body.faqs.length>20)error('Maksimum 20 soalan lazim dibenarkan.');
  const seen=new Set(),faqs=[];
  for(const item of body.faqs){
   if(!item||typeof item!=='object')error('Format soalan lazim tidak sah.');
   const question=safeText(item.question,'Soalan bot',150,5);
   const answer=safeText(item.answer,'Jawapan bot',1200,8);
   const key=question.toLocaleLowerCase('ms').replace(/\\s+/g,' ').trim();
   if(seen.has(key))error('Terdapat soalan yang berulang: '+question);
   seen.add(key);
   if(typeof item.enabled!=='boolean')error('Status soalan tidak sah.');
   faqs.push({question,answer,enabled:item.enabled});
  }
  await env.DB.prepare('UPDATE registration_2027_bot_config SET greeting=?,faq_json=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1')
   .bind(greeting,JSON.stringify(faqs),user.email).run();
  return json({ok:true,faqs:faqs.length});
 }
 if(path==='registration2027/settings'&&request.method==='GET'){
  if(access.role!=='admin')error('Tetapan hanya untuk pentadbir.',403);
  const row=await env.DB.prepare('SELECT parent_lookup_enabled AS enabled, admin_phone AS phone FROM registration_2027_public_settings WHERE id=1').first();
  return json({parentLookupEnabled:row?.enabled===1,adminPhone:row?.phone||''});
 }
 if(path==='registration2027/settings/save'&&request.method==='POST'){
  if(access.role!=='admin')error('Tetapan hanya untuk pentadbir.',403);
  const b=await parseBody(request);
  if(typeof b.parentLookupEnabled!=='boolean')error('Pilihan kebenaran carian ibu bapa tidak sah.');
  const phone=validAdminPhone(b.adminPhone);
  await env.DB.prepare('UPDATE registration_2027_public_settings SET parent_lookup_enabled=?,admin_phone=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').bind(b.parentLookupEnabled?1:0,phone,user.email).run();
  return json({ok:true,parentLookupEnabled:b.parentLookupEnabled,adminPhone:phone});
 }
 if(path==='registration2027/students'&&request.method==='GET') {
  const query=access.role!=='editor'
   ? env.DB.prepare('SELECT '+columns+' FROM registration_2027_students ORDER BY class_name,name LIMIT 5000')
   : env.DB.prepare('SELECT '+columns+' FROM registration_2027_students WHERE class_name=? ORDER BY name LIMIT 5000').bind(access.kelas);
  const rows=(await query.all()).results||[];
  return json({records:rows});
 }
 if(path==='registration2027/students/transfer' && request.method==='POST'){
  const {uid,version,from,to}=await parseBody(request);
  if(typeof uid!=='string'||!Number.isSafeInteger(version)||version<1||!CLASSES.includes(from)||!CLASSES.includes(to)||from===to)error('Maklumat pindah kelas tidak sah.');
  if(!allowed(access,from))error('Guru hanya boleh memindahkan murid kelas sendiri.',403);
  const done=await env.DB.prepare('UPDATE registration_2027_students SET class_name=?,updated_by=?,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE uid=? AND class_name=? AND version=? RETURNING version')
   .bind(to,user.email,uid,from,version).first();
  if(!done)error('Kelas atau rekod telah berubah. Muat semula senarai.',409);
  return json({ok:true,version:done.version});
 }
 if(path==='registration2027/deletions' && request.method==='GET'){
  const sql="SELECT student_name,class_name,actor_email,at FROM registration_2027_audit WHERE action='delete'";
  const query=access.role!=='editor'?env.DB.prepare(sql+' ORDER BY id DESC'):env.DB.prepare(sql+' AND class_name=? ORDER BY id DESC').bind(access.kelas);
  return json({records:(await query.all()).results});
 }
 if(path==='registration2027/transfers' && request.method==='GET'){
  const sql='SELECT student_name,from_class,to_class,actor_email,at FROM registration_2027_transfers';
  const query=access.role!=='editor'?env.DB.prepare(sql+' ORDER BY id DESC'):env.DB.prepare(sql+' WHERE from_class=? OR to_class=? ORDER BY id DESC').bind(access.kelas,access.kelas);
  return json({records:(await query.all()).results});
 }
 if(path==='registration2027/students/import'&&request.method==='POST') {
  const b=await parseBody(request,80000);
  if(!b||!Array.isArray(b.records)||b.records.length<1||b.records.length>25)error('Import mesti mengandungi 1–25 murid bagi setiap kelompok.',400);
  const rows=b.records.map(record=>validateRecord(record,true));
  const seen=new Set();
  for(const r of rows){
   if(!allowed(access,r.kelas))error('Fail mengandungi kelas yang tidak dibenarkan: '+r.kelas,403);
   const id=r.idMurid.toLocaleLowerCase('ms');
   if(seen.has(id))error('ID murid berulang dalam kelompok import: '+r.idMurid,400);
   seen.add(id);
  }
  let inserted=0,skipped=0;
  const skippedIds=[];
  for(const r of rows) {
   const uid=crypto.randomUUID();
   const result=await env.DB.prepare(
    'INSERT OR IGNORE INTO registration_2027_students(uid,student_id,class_name,name,pra,guardian_name,guardian_ic,guardian_phone,address,guardian_email,preschool_agency,jantina,agama,warga,bangsa,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
   ).bind(uid,r.idMurid,r.kelas,r.namaMurid,r.pra,r.namaPenjaga,r.noIc,r.noTelefon,r.alamat,r.emailPenjaga,r.agensiPra,r.jantina,r.agama,r.warga,r.bangsa,user.email).run();
   if(result.meta?.changes===1){
    inserted++;await audit(env,user.email,'create',uid,r.kelas);
   }else{skipped++;skippedIds.push(r.idMurid);}
  }
  return json({ok:true,received:rows.length,inserted,skipped,skippedIds});
 }
 if(path==='registration2027/students/save'&&request.method==='POST') {
  const b=await parseBody(request),r=validateRecord(b.record,Boolean(b.uid));
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
    const done=await env.DB.prepare("UPDATE registration_2027_students SET student_id=?,class_name=?,name=?,pra=?,guardian_name=?,guardian_ic=?,guardian_phone=?,address=?,guardian_email=COALESCE(?,guardian_email),preschool_agency=COALESCE(?,preschool_agency),jantina=COALESCE(?,jantina),agama=COALESCE(?,agama),warga=COALESCE(?,warga),bangsa=COALESCE(?,bangsa),version=version+1,updated_at=CURRENT_TIMESTAMP,updated_by=? WHERE uid=? AND version=? RETURNING version")
     .bind(r.idMurid,r.kelas,r.namaMurid,r.pra,r.namaPenjaga,r.noIc,r.noTelefon,r.alamat,b.record.emailPenjaga===undefined?null:r.emailPenjaga,b.record.agensiPra===undefined && r.pra!=='Tidak'?null:r.agensiPra,...['jantina','agama','warga','bangsa'].map(k=>b.record[k]===undefined?null:r[k]),user.email,uid,b.version).first();
    if(!done)error('Rekod diubah di peranti lain. Muat semula.',409);
   }catch(e){if(/UNIQUE constraint failed/i.test(e.message||''))error('ID murid telah didaftarkan.',409);throw e;}
   await audit(env,user.email,'update',uid,r.kelas);
   return json({ok:true,uid,version:b.version+1});
  }
  const newUid=crypto.randomUUID();
  try{
   await env.DB.prepare('INSERT INTO registration_2027_students(uid,student_id,class_name,name,pra,guardian_name,guardian_ic,guardian_phone,address,guardian_email,preschool_agency,jantina,agama,warga,bangsa,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(newUid,r.idMurid,r.kelas,r.namaMurid,r.pra,r.namaPenjaga,r.noIc,r.noTelefon,r.alamat,r.emailPenjaga,r.agensiPra,r.jantina,r.agama,r.warga,r.bangsa,user.email).run();
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
  const match=' WHERE uid=? AND version=? AND class_name=?';
  const args=[b.uid,b.version,old.kelas];
  const [,done]=await env.DB.batch([
   env.DB.prepare("INSERT INTO registration_2027_audit(actor_email,action,student_uid,class_name,student_name) SELECT ?,'delete',uid,class_name,name FROM registration_2027_students"+match).bind(user.email,...args),
   env.DB.prepare('DELETE FROM registration_2027_students'+match).bind(...args)
  ]);
  if(done.meta?.changes!==1)error('Rekod diubah pengguna lain. Muat semula.',409);
  return json({ok:true});
 }
 if(path.startsWith('registration2027/admins')) {
  if(access.role!=='admin'||access.canManageAdmins!==true)error('Hanya pentadbir MAPeM boleh melantik atau membatalkan admin Pendaftaran 2027.',403);
  if(path==='registration2027/admins'&&request.method==='GET'){
   const rows=(await env.DB.prepare('SELECT email,role,granted_by AS grantedBy,updated_at AS updatedAt FROM registration_2027_admins ORDER BY email').all()).results||[];
   return json({admins:rows});
  }
  if(path==='registration2027/admins/save'&&request.method==='POST'){
   const b=await parseBody(request),email=emailValue(b.email);
   if(email===user.email)error('Akaun sendiri sudah mempunyai akses pentadbir.');
   const role=b.role??'admin';
   if(!['viewer','admin'].includes(role))error('Peranan tidak sah.');
   await env.DB.prepare('INSERT INTO registration_2027_admins(email,granted_by,role) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET granted_by=excluded.granted_by,role=excluded.role,updated_at=CURRENT_TIMESTAMP').bind(email,user.email,role).run();
   await env.DB.prepare("INSERT INTO registration_2027_admin_audit(actor_email,target_email,action) VALUES(?,?,'grant')").bind(user.email,email).run();
   return json({ok:true});
  }
  if(path==='registration2027/admins/revoke'&&request.method==='POST'){
   const b=await parseBody(request),email=emailValue(b.email);
   if(email===user.email)error('Tidak boleh menarik balik akses sendiri.',403);
   const result=await env.DB.prepare('DELETE FROM registration_2027_admins WHERE email=?').bind(email).run();
   if(result.meta?.changes!==1)error('Admin tersebut tidak dijumpai.',404);
   await env.DB.prepare("INSERT INTO registration_2027_admin_audit(actor_email,target_email,action) VALUES(?,?,'revoke')").bind(user.email,email).run();
   return json({ok:true});
  }
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
