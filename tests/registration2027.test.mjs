import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {onRequest} from '../functions/api/[[path]].js';
import {parseCsv,mapImportRows,createExcelTemplate} from '../public/pendaftaran-tahun1-2027/import2027.mjs';
const ORIGIN='https://mapem-skpt-2026.pages.dev';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const migration of ['0001_init.sql','0002_google_pwa.sql','0003_admin_roles.sql','0004_award_responsibilities.sql','0005_portal_announcement.sql','0006_family_hub.sql','0007_tahap2_classes.sql','0008_exclude_year6.sql','0009_activity_logs.sql','0010_preserve_delima_t2.sql','0012_cerdas_plan_subgroups.sql','0013_subject_awards_quota.sql','0014_award_title_overrides.sql','0015_multiple_announcements.sql','0016_registration_tahun1_2027.sql','0017_registration_2027_delegated_admins.sql'])db.exec(file('../migrations/'+migration));
 const DB={prepare(sql){const stmt=db.prepare(sql);return {bind(...values){return {first(){return stmt.get(...values)||null;},all(){return {results:stmt.all(...values)};},run(){return {meta:{changes:stmt.run(...values).changes}};}};},first(){return stmt.get()||null;},all(){return {results:stmt.all()};}}}};
 const env={DB,GOOGLE_CLIENT_ID:'fake',GOOGLE_CLIENT_SECRET:'secret',APP_ORIGIN:ORIGIN,ADMIN_EMAILS:'admin@gmail.com'};
 async function cookie(email){
  db.prepare('INSERT INTO users(sub,email,name) VALUES(?,?,?)').run(email,email,email);
  const sid=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode('registration:'+email))).toString('hex');
  const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(sid))).toString('hex');
  db.prepare('INSERT INTO sessions(id_hash,user_sub,expires_at) VALUES(?,?,?)').run(hash,email,Math.floor(Date.now()/1000)+3600);
  return '__Host-mapem_session='+sid;
 }
 async function call(route,{who,method='GET',body,origin=ORIGIN}={}){
  const headers={...who?{Cookie:who}:{},...body!==undefined?{'Content-Type':'application/json',Origin:origin}:{}};
  return onRequest({env,request:new Request(ORIGIN+'/api/'+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)})});
 }
 return {db,env,cookie,call};
}
const record=(kelas,idMurid)=>({kelas,idMurid,namaMurid:'MURID UJIAN',pra:'Ya',namaPenjaga:'PENJAGA UJIAN',noIc:'000000000000',noTelefon:'0123456789',alamat:'ALAMAT UJIAN UNTUK SISTEM'});
test('pendaftaran2027 requires Google login and explicit per-class grant',async()=>{
 const {db,cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com'),guru=await cookie('guru@gmail.com'),other=await cookie('lain@gmail.com');
 assert.equal((await call('registration2027/students')).status,401);
 assert.equal((await call('registration2027/me',{who:guru})).status,403);
 const denied=await call('registration2027/access/save',{who:guru,method:'POST',body:{email:'guru@gmail.com',kelas:'Emerald'}});
 assert.equal(denied.status,403);
 const granted=await call('registration2027/access/save',{who:admin,method:'POST',body:{email:'guru@gmail.com',kelas:'Emerald'}});
 assert.equal(granted.status,200);
 const identity=await (await call('registration2027/me',{who:guru})).json();
 assert.equal(identity.role,'editor');assert.equal(identity.kelas,'Emerald');
 assert.equal((await call('registration2027/students',{who:other})).status,403);
 const saved=await call('registration2027/students/save',{who:guru,method:'POST',body:{record:record('Emerald','A00001')}});
 assert.equal(saved.status,201);
 const out=await saved.json();assert.equal(out.version,1);
 assert.equal((await call('registration2027/students/save',{who:guru,method:'POST',body:{record:record('Ruby','A00002')}})).status,403);
 const adminSave=await call('registration2027/students/save',{who:admin,method:'POST',body:{record:record('Ruby','B00001')}});
 assert.equal(adminSave.status,201);
 const teacherList=await (await call('registration2027/students',{who:guru})).json();
 assert.equal(teacherList.records.length,1);assert.equal(teacherList.records[0].kelas,'Emerald');
 assert.equal((await call('registration2027/students/delete',{who:guru,method:'POST',body:{uid:(await adminSave.json()).uid,version:1}})).status,403);
 const duplicate=await call('registration2027/students/save',{who:admin,method:'POST',body:{record:record('Ruby','a00001')}});
 assert.equal(duplicate.status,409);
 assert.equal((await call('registration2027/students/save',{who:guru,method:'POST',origin:'https://evil.example',body:{record:record('Emerald','Z00001')}})).status,403);
 const updated=await call('registration2027/students/save',{who:guru,method:'POST',body:{uid:out.uid,version:1,record:{...record('Emerald','A00001'),namaMurid:'MURID BAHARU'}}});
 assert.equal(updated.status,200);
 assert.equal((await call('registration2027/students/save',{who:guru,method:'POST',body:{uid:out.uid,version:1,record:record('Emerald','A00001')}})).status,409);
 assert.equal((await call('registration2027/access/revoke',{who:admin,method:'POST',body:{email:'guru@gmail.com'}})).status,200);
 assert.equal((await call('registration2027/students',{who:guru})).status,403);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM registration_2027_students').get().n,2);
});
test('pendaftaran UI has local change/reset and Cloudflare modes without embedded student data',()=>{
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 assert.match(html,/Tukar Kata Laluan Setempat/);
 assert.match(html,/Reset Kata Laluan Setempat/);
 assert.match(html,/cloudApi\('students'/);
 assert.match(html,/localStorage\.removeItem\(STORE\)/);
 assert.match(html,/Lupa kata laluan\?/);
});

test('registration admins can be delegated only by a real MaPeM admin',async()=>{
 const {cookie,call}=fixture();
 const owner=await cookie('admin@gmail.com'),secondary=await cookie('secondary@gmail.com'),teacher=await cookie('teacher@gmail.com');
 assert.equal((await call('registration2027/admins/save',{who:teacher,method:'POST',body:{email:'other@gmail.com'}})).status,403);
 const result=await call('registration2027/admins/save',{who:owner,method:'POST',body:{email:'secondary@gmail.com'}});
 assert.equal(result.status,200);
 const identity=await (await call('registration2027/me',{who:secondary})).json();
 assert.equal(identity.role,'admin');assert.equal(identity.canManageAdmins,false);
 const mapem=await (await call('me',{who:secondary})).json();
 assert.equal(mapem.user.role,'viewer'); // Delegation does not grant MaPeM admin.
 assert.equal((await call('registration2027/access/save',{who:secondary,method:'POST',body:{email:'teacher@gmail.com',kelas:'Ruby'}})).status,200);
 assert.equal((await call('registration2027/admins/save',{who:secondary,method:'POST',body:{email:'another@gmail.com'}})).status,403);
 assert.equal((await call('registration2027/admins',{who:secondary})).status,403);
 assert.equal((await call('registration2027/admins/revoke',{who:owner,method:'POST',body:{email:'secondary@gmail.com'}})).status,200);
 assert.equal((await call('registration2027/students',{who:secondary})).status,403);
 const editor=await (await call('registration2027/me',{who:teacher})).json();assert.equal(editor.kelas,'Ruby');
});
test('import validates entire batch, class restrictions and skips existing IDs',async()=>{
 const {db,cookie,call}=fixture();
 const owner=await cookie('admin@gmail.com'),teacher=await cookie('emerald@gmail.com');
 await call('registration2027/access/save',{who:owner,method:'POST',body:{email:'emerald@gmail.com',kelas:'Emerald'}});
 const first=await call('registration2027/students/import',{who:teacher,method:'POST',body:{records:[record('Emerald','ID-001'),record('Emerald','ID-002')]}});
 assert.equal(first.status,200);assert.deepEqual((await first.json()).inserted,2);
 const repeated=await call('registration2027/students/import',{who:teacher,method:'POST',body:{records:[record('Emerald','ID-001'),record('Emerald','ID-003')]}});
 const v=await repeated.json();assert.equal(v.inserted,1);assert.equal(v.skipped,1);assert.deepEqual(v.skippedIds,['ID-001']);
 assert.equal((await call('registration2027/students/import',{who:teacher,method:'POST',body:{records:[record('Emerald','ID-004'),record('Ruby','ID-005')]}})).status,403);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM registration_2027_students').get().n,3);
 assert.equal((await call('registration2027/students/import',{who:owner,method:'POST',body:{records:[record('Ruby','SAME'),record('Ruby','same')]}})).status,400);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM registration_2027_students').get().n,3);
 assert.equal((await call('registration2027/students/import',{who:owner,method:'POST',body:{records:Array.from({length:26},(_,i)=>record('Amber','A'+String(i).padStart(3,'0')))}})).status,400);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM registration_2027_students').get().n,3);
 assert.equal((await call('registration2027/students/import',{who:owner,method:'POST',origin:'https://evil.example',body:{records:[record('Ruby','UNAUTH')]}})).status,403);
});
test('CSV import parses quoted fields, headers and validates rows; Excel template is a ZIP workbook',async()=>{
 const csv='Kelas,ID Murid,Nama Murid,PRA,Nama Ibu Bapa/Penjaga,No IC Penjaga,No Telefon,Alamat Terkini\\r\\nEmerald,00001,NAMA PELAJAR,Ya,NAMA PENJAGA,001122334455,0123456789,"Jalan 1, Telipok"\\r\\n';
 const csv2=csv.replaceAll('\\r\\n','\r\n');
 const parsed=parseCsv(csv2);
 assert.equal(parsed.length,2);assert.equal(parsed[1][7],'Jalan 1, Telipok');
 const checked=mapImportRows(parsed,{defaultClass:'Semua',allowedClass:'Emerald'});
 assert.equal(checked.errors.length,0);assert.equal(checked.records[0].idMurid,'00001');
 assert.equal(checked.records[0].noTelefon,'0123456789');
 const fail=mapImportRows(parsed,{defaultClass:'Semua',allowedClass:'Ruby'});
 assert.equal(fail.records.length,0);assert.equal(fail.errors.length,1);
 const blob=createExcelTemplate('Sapphire');const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);assert(bytes.length>10000);
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 assert.match(html,/Templat Excel/);assert.match(html,/Import Excel \/ CSV/);assert.match(html,/Admin Pendaftaran/);
 const script=html.split('<script type="module">')[1]?.split('</script>')[0];
 assert.ok(script,'inline module should exist');
 assert.doesNotThrow(()=>new Function(script.slice(script.indexOf(';')+1)));
});
