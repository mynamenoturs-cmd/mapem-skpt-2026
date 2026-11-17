import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {onRequest} from '../functions/api/[[path]].js';
import {onRequest as registrationApi} from '../registration-site/functions/api/[[path]].js';
import {handleRegistration2027} from '../functions/api/_registration2027.js';
import {answerRegistrationQuestion,DEFAULT_TEACHERS,QUICK_QUESTIONS,containsPrivateRegistrationDetails} from '../public/pendaftaran-tahun1-2027/bot2027.mjs';
import {tidyRegistrationAIAnswer} from '../registration-site/functions/api/_ai2027.js';
import {parseCsv,mapImportRows,createExcelTemplate} from '../public/pendaftaran-tahun1-2027/import2027.mjs';
const ORIGIN='https://mapem-skpt-2026.pages.dev';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const migration of ['0001_init.sql','0002_google_pwa.sql','0003_admin_roles.sql','0004_award_responsibilities.sql','0005_portal_announcement.sql','0006_family_hub.sql','0007_tahap2_classes.sql','0008_exclude_year6.sql','0009_activity_logs.sql','0010_preserve_delima_t2.sql','0012_cerdas_plan_subgroups.sql','0013_subject_awards_quota.sql','0014_award_title_overrides.sql','0015_multiple_announcements.sql','0016_registration_tahun1_2027.sql','0017_registration_2027_delegated_admins.sql','0018_registration_2027_login_bridge.sql','0019_registration_teachers_parent_portal.sql','0020_registration_ai_limits.sql','0021_registration2027_bot_config.sql'])db.exec(file('../migrations/'+migration));
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

test('dedicated hostname redeems one-time Google bridge ticket and isolates sessions',async()=>{
 const {env,cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com'),viewer=await cookie('viewer@sample.com');
 const start=await call('registration2027/transfer/start',{who:admin});
 assert.equal(start.status,302);
 const url=new URL(start.headers.get('Location'));
 assert.equal(url.hostname,'pendaftaran-tahun1-2027-skpt.pages.dev');
 assert.equal(url.pathname,'/api/session/redeem');
 const code=url.searchParams.get('code');assert.match(code,/^[a-f0-9]{64}$/);
 const dedicatedOrigin='https://pendaftaran-tahun1-2027-skpt.pages.dev';
 const redeem=await registrationApi({env,request:new Request(url)});
 assert.equal(redeem.status,302);
 assert.equal(redeem.headers.get('Location'),'/');
 const newCookie=redeem.headers.get('Set-Cookie').split(';')[0];
 assert.match(newCookie,/^__Host-tahun1_2027_session=/);
 const me=await registrationApi({env,request:new Request(dedicatedOrigin+'/api/registration2027/me',{headers:{Cookie:newCookie}})});
 assert.equal(me.status,200);
 assert.equal((await me.json()).role,'admin');
 const repeat=await registrationApi({env,request:new Request(url)});
 assert.equal(repeat.status,302);assert.equal(repeat.headers.get('Location'),'/?login=expired');
 const outsider=await registrationApi({env,request:new Request(dedicatedOrigin+'/api/registration2027/students')});
 assert.equal(outsider.status,401);
 const wrongOrigin=await registrationApi({env,request:new Request(dedicatedOrigin+'/api/registration2027/students/import',{method:'POST',headers:{Cookie:newCookie,Origin:'https://evil.example','Content-Type':'application/json'},body:'{"records":[]}'})});
 assert.equal(wrongOrigin.status,403);
 const noAccess=await call('registration2027/transfer/start',{who:viewer});
 assert.equal(noAccess.status,302);assert.match(noAccess.headers.get('Location'),/login=not-authorized/);
 const needsGoogle=await call('registration2027/transfer/start');
 assert.equal(needsGoogle.status,302);assert.match(needsGoogle.headers.get('Location'),/auth\/google\/start\?next=registration2027standalone/);
 const logout=await registrationApi({env,request:new Request(dedicatedOrigin+'/api/logout',{method:'POST',headers:{Cookie:newCookie,Origin:dedicatedOrigin}})});
 assert.equal(logout.status,200);
 const after=await registrationApi({env,request:new Request(dedicatedOrigin+'/api/registration2027/me',{headers:{Cookie:newCookie}})});
 assert.equal(after.status,401);
});
test('new interface contains accessible mobile navigation, landing and administrator menu',()=>{
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 for(const id of ['authPage','login-intro','mainNav','workspaceSidebar','dashboardLanding','statsPanel','classCards','listLayout','mobileNavToggle','sidebarShade','quickImport','quickTemplate','adminOverlay']){
  if(id==='login-intro')assert.match(html,/class="login-intro"/);
  else assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/Portal Pendaftaran Tahun 1 2027/);
 assert.match(html,/pendaftaran-tahun1-2027-skpt.pages.dev/);
 assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//);
});

test('9 classroom teachers are seeded with exact class names and passport photo slots',async()=>{
 const {env,cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com'),emerald=await cookie('emerald@sample.com');
 const response=await call('registration2027/teachers',{who:admin});
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.teachers.length,9);
 const expected={
  Emerald:'Kamelia Nur Binti Raisin',
  Ruby:'Airin Bin Alin',
  Sapphire:'Ahmad Rifa’I Bin Syamsuddin',
  Topaz:'Raisah Sandau',
  Diamond:'Hayati Binti Abdul Rahim',
  Jade:'Nur Ainun Arinah Binti Ramlee',
  Pearl:'Nurul Umaierah Binti Abdul Rapi',
  Crystal:'Nur Amalina Binti Mali',
  Amber:'Mazniza Binti Mahadzir'
 };
 for(const t of body.teachers){assert.equal(t.namaGuru,expected[t.kelas]);assert.equal(t.gambarPasport,null);}
 const unauth=await call('registration2027/teachers');assert.equal(unauth.status,401);
 const publicInfo=await registrationApi({env,request:new Request('https://pendaftaran-tahun1-2027-skpt.pages.dev/api/public/teachers')});
 assert.equal(publicInfo.status,200);
 const publicData=await publicInfo.json();
 assert.equal(publicData.teachers.length,9);
 assert.equal(publicData.canSearchStudents,false);
 assert.equal(publicData.adminPhone,'');
 assert(!JSON.stringify(publicData).includes('guardian_ic'));
 assert.equal((await call('registration2027/teachers/save',{who:emerald,method:'POST',body:{kelas:'Emerald',namaGuru:'NAMA BARU'}})).status,403);
});
test('only authorized class teacher or admin can update passport photo, not other class',async()=>{
 const {env,cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com'),teacher=await cookie('teacher@sample.com');
 assert.equal((await call('registration2027/access/save',{who:admin,method:'POST',body:{email:'teacher@sample.com',kelas:'Emerald'}})).status,200);
 const image=Buffer.alloc(540,17);image[0]=255;image[1]=216;image[2]=255;
 const photo='data:image/jpeg;base64,'+image.toString('base64');
 const allowed=await call('registration2027/teachers/save',{who:teacher,method:'POST',body:{kelas:'Emerald',namaGuru:'Kamelia Nur Binti Raisin',gambarPasport:photo}});
 assert.equal(allowed.status,200);
 const pub=await (await registrationApi({env,request:new Request('https://pendaftaran-tahun1-2027-skpt.pages.dev/api/public/teachers')})).json();
 assert.equal(pub.teachers.find(t=>t.kelas==='Emerald').gambarPasport,photo);
 assert.equal((await call('registration2027/teachers/save',{who:teacher,method:'POST',body:{kelas:'Ruby',namaGuru:'Airin Bin Alin',gambarPasport:photo}})).status,403);
 assert.equal((await call('registration2027/teachers/save',{who:teacher,method:'POST',body:{kelas:'Emerald',namaGuru:'BUKAN GURU SEBENAR'}})).status,403);
 assert.equal((await call('registration2027/teachers/save',{who:admin,method:'POST',body:{kelas:'Ruby',gambarPasport:'data:text/html;base64,PGh0bWw+'}})).status,400);
 assert.equal((await call('registration2027/teachers/save',{who:admin,method:'POST',body:{kelas:'Emerald',gambarPasport:''}})).status,200);
 const removed=await (await call('registration2027/teachers',{who:admin})).json();
 assert.equal(removed.teachers.find(t=>t.kelas==='Emerald').gambarPasport,null);
});
test('parent lookup off by default; explicit admin publish reveals only name/class with rate limit',async()=>{
 const {env,cookie,call}=fixture();
 const base='https://pendaftaran-tahun1-2027-skpt.pages.dev';
 const admin=await cookie('admin@gmail.com'),teacher=await cookie('teacher@sample.com');
 await call('registration2027/access/save',{who:admin,method:'POST',body:{email:'teacher@sample.com',kelas:'Emerald'}});
 await call('registration2027/students/save',{who:admin,method:'POST',body:{record:{...record('Emerald','CHILD-001'),namaMurid:'ANAK MURID TELIPOK'}}});
 const lookup=()=>registrationApi({env,request:new Request(base+'/api/public/lookup?q=ANAK%20MURID',{headers:{'cf-connecting-ip':'203.0.113.10'}})});
 assert.equal((await lookup()).status,403);
 assert.equal((await call('registration2027/settings',{who:teacher})).status,403);
 assert.equal((await call('registration2027/settings/save',{who:teacher,method:'POST',body:{parentLookupEnabled:true,adminPhone:'0123456789'}})).status,403);
 const publish=await call('registration2027/settings/save',{who:admin,method:'POST',body:{parentLookupEnabled:true,adminPhone:'0123456789'}});
 assert.equal(publish.status,200);
 const info=await (await registrationApi({env,request:new Request(base+'/api/public/teachers')})).json();
 assert.equal(info.canSearchStudents,true);assert.equal(info.adminPhone,'0123456789');
 const search=await lookup();assert.equal(search.status,200);
 const parent=await search.json();
 assert.equal(parent.results.length,1);
 assert.deepEqual(Object.keys(parent.results[0]).sort(),['kelas','namaMurid']);
 assert.equal(parent.results[0].namaMurid,'ANAK MURID TELIPOK');
 assert.equal((await registrationApi({env,request:new Request(base+'/api/public/lookup?q=AN')})).status,400);
 assert.equal((await registrationApi({env,request:new Request(base+'/api/registration2027/students')})).status,401);
 for(let i=0;i<34;i++)await lookup();
 assert.equal((await lookup()).status,429);
 assert.equal((await call('registration2027/settings/save',{who:admin,method:'POST',body:{parentLookupEnabled:false,adminPhone:''}})).status,200);
 assert.equal((await lookup()).status,403);
});
test('student parent page exposes no private fields or edit controls',()=>{
 const html=file('../public/pendaftaran-tahun1-2027/ibu-bapa/index.html');
 assert.match(html,/Paparan Ibu Bapa \/ Penjaga/);
 assert.match(html,/\/api\/public\/teachers/);
 assert.match(html,/\/api\/public\/lookup/);
 assert.doesNotMatch(html,/(guardian_ic|noIc|namaPenjaga|alamatTerkini|\/api\/registration2027\/students\/save)/);
 const main=file('../public/pendaftaran-tahun1-2027/index.html');
 for(const id of ['teacherSection','teacherCards','teacherOverlay','teacherPhotoFile','teacherPhotoPreview','publicSettingsOverlay','publicSettingsForm','parentLookupSwitch','publicAdminPhone'])
  assert.match(main,new RegExp('id="'+id+'"'));
 assert.match(main,/Kamelia Nur Binti Raisin/);
 assert.match(main,/Ahmad Rifa’I Bin Syamsuddin/);
});

test('large teacher passport image under 600 KB is accepted and oversize image rejected',async()=>{
 const {cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com');
 const makePhoto=size=>{
   const bytes=Buffer.alloc(size,7);
   bytes[0]=255;bytes[1]=216;bytes[2]=255;
   return 'data:image/jpeg;base64,'+bytes.toString('base64');
 };
 const accepted=await call('registration2027/teachers/save',{
   who:admin,method:'POST',body:{kelas:'Emerald',gambarPasport:makePhoto(475000)}
 });
 assert.equal(accepted.status,200);
 const rows=await (await call('registration2027/teachers',{who:admin})).json();
 assert.ok(rows.teachers.find(x=>x.kelas==='Emerald').gambarPasport.length>600000);
 const oversize=await call('registration2027/teachers/save',{
   who:admin,method:'POST',body:{kelas:'Ruby',gambarPasport:makePhoto(600001)}
 });
 assert.equal(oversize.status,413);
 const bad=await call('registration2027/teachers/save',{
   who:admin,method:'POST',body:{kelas:'Ruby',gambarPasport:'data:text/html;base64,'+Buffer.alloc(500,12).toString('base64')}
 });
 assert.equal(bad.status,400);
});
test('all nine class options render photographs, teacher names and selected teacher profile',()=>{
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 for(const id of ['classTeacherHero','selectedTeacherPhoto','selectedTeacherClass','selectedTeacherName','selectedTeacherNote','selectedTeacherUpload'])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/function renderClassTeacherNav/);
 assert.match(html,/function renderSelectedClassTeacher/);
 assert.match(html,/photoThumb\(teacher,'nav-teacher-photo'\)/);
 assert.match(html,/Kelas 1 '\+activeClass/);
 assert.match(html,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/\[\[1050,1500\],\[840,1200\],\[700,1000\]\]/);
 assert.match(html,/output.length<=790000/);
 assert.match(html,/12\*1024\*1024/);
});

test('bot answers official facts and does not invent dates or required documents',()=>{
 assert.equal(DEFAULT_TEACHERS.length,9);
 assert.equal(QUICK_QUESTIONS.length,5);
 const ruby=answerRegistrationQuestion('Siapa guru kelas 1 Ruby?');
 assert.match(ruby.text,/Airin Bin Alin/);
 const emerald=answerRegistrationQuestion('Guru kelas Emerald');
 assert.match(emerald.text,/Kamelia Nur Binti Raisin/);
 const list=answerRegistrationQuestion('Senarai guru kelas');
 assert.match(list.text,/1 Crystal/);
 assert.match(list.text,/Nur Amalina Binti Mali/);
 const date=answerRegistrationQuestion('Bila tarikh pendaftaran tutup?');
 assert.match(date.text,/belum dinyatakan/);
 assert.doesNotMatch(date.text,/\d{1,2}[\/-]\d{1,2}[\/-]2027/);
 const documents=answerRegistrationQuestion('Apa dokumen diperlukan?');
 assert.match(documents.text,/belum dinyatakan/);
 const closed=answerRegistrationQuestion('Cara semak kelas anak');
 assert.match(closed.text,/belum dibuka/);
 const opened=answerRegistrationQuestion('Cara semak kelas anak',{canSearchStudents:true});
 assert.match(opened.text,/Paparan Ibu Bapa/);
 const phone=answerRegistrationQuestion('Hubungi admin',{adminPhone:'0123456789'});
 assert.equal(phone.links[0].href.startsWith('https://wa.me/60123456789'),true);
 assert.equal(phone.links[1].href,'tel:+60123456789');
 const pii=answerRegistrationQuestion('MyKid anak 120101-12-1234');
 assert.match(pii.text,/Jangan kongsi/);
 const unknown=answerRegistrationQuestion('Bila dapat buku teks?');
 assert.match(unknown.text,/belum dinyatakan|belum mempunyai/);
});
test('bot endpoint is public but returns only approved teacher names and contact settings',async()=>{
 const {env,cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com');
 const origin='https://pendaftaran-tahun1-2027-skpt.pages.dev';
 const request=()=>registrationApi({env,request:new Request(origin+'/api/public/assistant')});
 const initial=await request();assert.equal(initial.status,200);
 const data=await initial.json();
 assert.equal(data.teachers.length,9);
 assert.deepEqual(Object.keys(data.teachers[0]).sort(),['kelas','namaGuru']);
 assert.equal(data.canSearchStudents,false);
 assert.equal(data.adminPhone,'');
 assert.doesNotMatch(JSON.stringify(data),/(noIc|noTelefon|guardian_ic|gambarPasport|alamat)/);
 await call('registration2027/settings/save',{who:admin,method:'POST',body:{adminPhone:'0123456789',parentLookupEnabled:true}});
 const changed=await (await request()).json();
 assert.equal(changed.canSearchStudents,true);
 assert.equal(changed.adminPhone,'0123456789');
});
test('both portal pages load chat module and workflow deploys its assets',()=>{
 const main=file('../public/pendaftaran-tahun1-2027/index.html');
 const parents=file('../public/pendaftaran-tahun1-2027/ibu-bapa/index.html');
 const workflow=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 for(const html of [main,parents]){
  assert.match(html,/href="\/bot2027\.css"/);
  assert.match(html,/src="\/bot2027\.mjs"/);
 }
 assert.match(workflow,/bot2027\.mjs/);
 assert.match(workflow,/bot2027\.css/);
 const bot=file('../public/pendaftaran-tahun1-2027/bot2027.mjs');
 assert.match(bot,/Jangan taip IC, MyKid atau alamat murid/);
 assert.doesNotMatch(bot,/localStorage|sessionStorage/);
 assert.match(bot,/containsPrivateRegistrationDetails\(val\)/);
 assert.match(bot,/fetch\('\/api\/public\/ai'/);
});

test('Cloudflare AI endpoint uses approved facts, caps requests, and falls back without binding',async()=>{
 const {env,db}=fixture();
 const base='https://pendaftaran-tahun1-2027-skpt.pages.dev';
 const call=question=>registrationApi({env,request:new Request(base+'/api/public/ai',{
  method:'POST',headers:{Origin:base,'Content-Type':'application/json','cf-connecting-ip':'198.51.100.57'},
  body:JSON.stringify({question})
 })});
 const before=await (await call('Cara nak daftar tahun 1?')).json();
 assert.equal(before.mode,'faq');
 const status=await (await registrationApi({env,request:new Request(base+'/api/public/ai')})).json();
 assert.equal(status.available,false);
 let times=0;
 env.AI={run:async(model,opts)=>{
  times++;
  assert.equal(model,'@cf/zai-org/glm-4.7-flash');
  assert.match(opts.messages[0].content,/Nur Amalina Binti Mali/);
  assert.match(opts.messages[0].content,/belum diumumkan/);
  assert.doesNotMatch(opts.messages[0].content,/PENJAGA UJIAN|000000000000/);
  assert.equal(opts.chat_template_kwargs.enable_thinking,false);
  return {choices:[{message:{content:'Sila hubungi sekolah untuk perkara tersebut.'}}]};
 }};
 const real=await (await call('Bagaimanakah urusan pendaftaran dibuat?')).json();
 assert.equal(real.mode,'ai');
 assert.match(real.text,/Sila hubungi sekolah/);
 assert.equal(times,1);
 const privacy=await (await call('MyKid 120101-12-1234')).json();
 assert.equal(privacy.mode,'faq');assert.equal(privacy.reason,'privacy');
 const emails=await (await call('Email saya ibu@example.com')).json();
 assert.equal(emails.mode,'faq');
 assert.equal(times,1);
 assert.equal(containsPrivateRegistrationDetails('MyKid 120101-12-1234'),true);
 assert.equal(containsPrivateRegistrationDetails('anak saya di kelas mana'),true);
 assert.equal(containsPrivateRegistrationDetails('Anak saya Amin ke sekolah ini?'),true);
 assert.equal(containsPrivateRegistrationDetails('Berapa kelas tahun 1?'),false);
 const blocked=await (await call('anak saya di kelas mana')).json();
 assert.equal(blocked.mode,'faq');
 assert.equal(times,1);
 for(let i=1;i<15;i++){
  const answer=await (await call('Soalan umum tentang pendaftaran nombor '+i)).json();
  assert.equal(answer.mode,'ai');
 }
 const limit=await (await call('Cara daftar di sekolah?')).json();
 assert.equal(limit.mode,'faq');assert.equal(limit.reason,'client-limit');
 assert.equal(times,15);
 assert.ok(db.prepare("SELECT request_count FROM registration_2027_ai_limits WHERE counter_key LIKE 'g:%'").get().request_count>=15);
 const cross=await registrationApi({env,request:new Request(base+'/api/public/ai',{
  method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},
  body:JSON.stringify({question:'Cara pendaftaran?'})
 })});
 assert.equal(cross.status,403);
});
test('AI integration deploys a free-tier model binding and keeps FAQ fallback',()=>{
 const server=file('../registration-site/functions/api/_ai2027.js');
 const workflow=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 const client=file('../public/pendaftaran-tahun1-2027/bot2027.mjs');
 assert.match(server,/@cf\/zai-org\/glm-4\.7-flash/);
 assert.match(server,/WORLD_LIMIT=100/);
 assert.match(server,/CLIENT_LIMIT=15/);
 assert.doesNotMatch(server,/registration_2027_students/);
 assert.match(workflow,/binding = "AI"/);
 assert.match(workflow,/wrangler\.toml/);
 assert.match(workflow,/registration-site\/functions\/api\/_ai2027\.js/);
 assert.match(client,/\/api\/public\/ai/);
 assert.match(client,/Jawapan FAQ automatik/);
});

test('Cikgu Wanwan BOT has an animated mascot and consistent identity on both pages',()=>{
 const bot=file('../public/pendaftaran-tahun1-2027/bot2027.mjs');
 const style=file('../public/pendaftaran-tahun1-2027/bot2027.css');
 const ai=file('../registration-site/functions/api/_ai2027.js');
 const workflow=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 assert.match(bot,/Cikgu Wanwan BOT/);
 assert.match(bot,/assets\/cikgu-wanwan-bot-v2\.gif/);
 assert.match(bot,/t1chat-launcher-mascot/);
 assert.match(style,/t1wanwanFloat/);
 assert.match(style,/prefers-reduced-motion/);
 assert.match(ai,/Anda Cikgu Wanwan BOT/);
 assert.match(workflow,/assets\/cikgu-wanwan-bot\.gif/);
});

test('avatar v2 fixes mobile label size and provides a colorful animated avatar with fallback',()=>{
 const bot=file('../public/pendaftaran-tahun1-2027/bot2027.mjs');
 const css=file('../public/pendaftaran-tahun1-2027/bot2027.css');
 const wf=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 assert.match(bot,/cikgu-wanwan-bot-v2\.gif/);
 assert.match(bot,/stillFallback/);
 assert.match(css,/\.t1chat-launcher>\.t1chat-launcher-label\{font-size:11px!important/);
 assert.match(css,/cikgu-wanwan-bot-v2-still\.webp/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(wf,/cikgu-wanwan-bot-v2\.gif/);
 assert.match(wf,/cikgu-wanwan-bot-v2-still\.webp/);
});

test('pentadbir can edit official BOT greetings and FAQs without changing code; other teachers cannot',async()=>{
 const {env}=fixture();
 const admin={role:'admin',email:'admin@gmail.com'};
 const user={role:'viewer',email:'viewer@gmail.com'};
 const path='registration2027/bot/config';
 const get=async(who)=>handleRegistration2027({
  request:new Request('https://pendaftaran-tahun1-2027-skpt.pages.dev/api/'+path),env,user:who,path
 });
 const read=await get(admin);
 assert.equal(read.status,200);
 const initial=await read.json();
 assert.match(initial.greeting,/Assalamualaikum dan salam sejahtera/);
 assert.equal(initial.faqs.length,5);
 await assert.rejects(get(user),{status:403});
 const body={greeting:'Assalamualaikum dan salam sejahtera! Saya Cikgu Wanwan BOT. Selamat datang ke SK Pekan Telipok bagi pendaftaran Tahun 1 sesi 2027.',faqs:[
  {question:'Bilakah pendaftaran Tahun 1 bermula?',answer:'Sila hadir mengikut makluman rasmi sekolah yang akan diumumkan kemudian.',enabled:true},
  {question:'Soalan dinyahaktifkan',answer:'Tidak diterbitkan kepada pengguna awam.',enabled:false}
 ]};
 const update=async(candidate,who=admin)=>handleRegistration2027({
  request:new Request('https://pendaftaran-tahun1-2027-skpt.pages.dev/api/registration2027/bot/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(candidate)}),
  env,user:who,path:'registration2027/bot/save'
 });
 await assert.rejects(update(body,user),{status:403});
 assert.equal((await update(body)).status,200);
 const duplicate={...body,faqs:[body.faqs[0],body.faqs[0]]};
 await assert.rejects(update(duplicate),{status:400});
 const tooMany={...body,faqs:Array.from({length:21},(_,i)=>({question:'Soalan '+i,answer:'Jawapan rujukan rasmi',enabled:true}))};
 await assert.rejects(update(tooMany),{status:400});
 const published=await registrationApi({env,request:new Request('https://pendaftaran-tahun1-2027-skpt.pages.dev/api/public/assistant')});
 assert.equal(published.status,200);
 const bot=await published.json();
 assert.equal(bot.greeting,body.greeting);
 assert.equal(bot.faqs.length,1);
 assert.equal(bot.faqs[0].question,body.faqs[0].question);
 assert.deepEqual(Object.keys(bot.faqs[0]).sort(),['answer','question']);
 assert.doesNotMatch(JSON.stringify(bot),/Soalan dinyahaktifkan|registration_2027_students|noIc/);
});
test('editable FAQ is available for the local fallback, AI prompt and the linked admin editor',()=>{
 const script=file('../public/pendaftaran-tahun1-2027/bot2027.mjs');
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 const adminPage=file('../public/pendaftaran-tahun1-2027/bot-admin/index.html');
 const workflow=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 const ai=file('../registration-site/functions/api/_ai2027.js');
 assert.match(script,/Assalamualaikum dan salam sejahtera/);
 assert.match(script,/renderQuickQuestions/);
 assert.match(script,/curated/);
 assert.match(html,/navBotSettings/);
 assert.match(html,/\/bot-admin\//);
 assert.match(adminPage,/api\('bot\/save'/);
 assert.match(adminPage,/Simpan Semua Perubahan/);
 assert.match(workflow,/bot-admin\/index\.html/);
 assert.match(ai,/officialFaqs/);
});

test('Cikgu Wanwan BOT replies naturally, without restarting with salam on every answer',()=>{
 const natural=tidyRegistrationAIAnswer(
  'Assalamualaikum dan salam sejahtera! Guru kelas 1 Ruby ialah Airin Bin Alin.',
  'Siapa guru kelas 1 Ruby?'
 );
 assert.equal(natural,'Guru kelas 1 Ruby ialah Airin Bin Alin.');
 assert.equal(tidyRegistrationAIAnswer(
  'Waalaikumussalam! Nama guru kelas Topaz ialah Raisah Sandau.',
  'Boleh beri nama guru kelas Topaz?'
 ),'Nama guru kelas Topaz ialah Raisah Sandau.');
 assert.equal(tidyRegistrationAIAnswer(
  'Saya Cikgu Wanwan BOT, pembantu pendaftaran sekolah. Sila hubungi sekolah.',
  'Bila tarikh pendaftaran?'
 ),'Sila hubungi sekolah.');
 assert.equal(tidyRegistrationAIAnswer('Assalamualaikum! Ada yang boleh saya bantu?','Assalamualaikum'), 'Assalamualaikum! Ada yang boleh saya bantu?');
 assert.match(answerRegistrationQuestion('Assalamualaikum').text,/Waalaikumussalam/);
 assert.doesNotMatch(answerRegistrationQuestion('Assalamualaikum').text,/Saya Cikgu Wanwan BOT/);
 assert.match(answerRegistrationQuestion('Hai').text,/Ada apa yang boleh saya bantu/);
 assert.match(answerRegistrationQuestion('Hai, saya nak tahu guru kelas Ruby?').text,/Airin Bin Alin/);
 const source=file('../registration-site/functions/api/_ai2027.js');
 assert.match(source,/UCAPAN PEMBUKAAN SUDAH DIPAPARKAN/);
 assert.doesNotMatch(source,/Untuk menyapa, mulakan dengan Assalamualaikum/);
});

test('Portal Tahun 1 is installable as a standalone PWA with official SKPT icons',()=>{
 const manifest=JSON.parse(file('../public/pendaftaran-tahun1-2027/manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.scope,'/');
 assert.match(manifest.name,/Pendaftaran Tahun 1 2027/);
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 for(const icon of manifest.icons){
  const bytes=readFileSync(new URL('../public/pendaftaran-tahun1-2027'+icon.src,import.meta.url));
  assert.equal(bytes.subarray(1,4).toString('ascii'),'PNG');
  assert.ok(bytes.readUInt32BE(16)>=192&&bytes.readUInt32BE(20)>=192);
 }
 const apple=readFileSync(new URL('../public/pendaftaran-tahun1-2027/icons/apple-touch-icon.png',import.meta.url));
 assert.equal(apple.readUInt32BE(16),180);
 assert.equal(apple.readUInt32BE(20),180);
 for(const path of ['../public/pendaftaran-tahun1-2027/index.html','../public/pendaftaran-tahun1-2027/ibu-bapa/index.html','../public/pendaftaran-tahun1-2027/bot-admin/index.html']){
  const html=file(path);
  assert.match(html,/rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html,/rel="apple-touch-icon" sizes="180x180"/);
  assert.match(html,/apple-mobile-web-app-capable/);
  assert.match(html,/src="\/pwa2027\.mjs"/);
  assert.match(html,/href="\/pwa2027\.css"/);
 }
});
test('PWA installer supports Safari iPhone and Chrome Android without App Store or private account data',()=>{
 const installer=file('../public/pendaftaran-tahun1-2027/pwa2027.mjs');
 assert.match(installer,/beforeinstallprompt/);
 assert.match(installer,/serviceWorker\.register\('\/sw\.js'/);
 assert.match(installer,/Add to Home Screen/);
 assert.match(installer,/Safari/);
 assert.match(installer,/Google Chrome/);
 assert.match(installer,/window\.matchMedia/);
 assert.doesNotMatch(installer,/localStorage|registration_2027_students/);
});
test('PWA service worker only caches static shell and never caches registration API responses',()=>{
 const sw=file('../public/pendaftaran-tahun1-2027/sw.js');
 assert.match(sw,/request\.method!=='GET'/);
 assert.match(sw,/startsWith\('\/api\/'\)/);
 assert.match(sw,/request\.headers\.has\('authorization'\)/);
 assert.match(sw,/if\(!isAllowed\(request,url\)\)return/);
 assert.doesNotMatch(sw,/registration_2027_students|guardianPhone|studentRecords/);
 const workflow=file('../.github/workflows/pendaftaran-2027-cloudflare.yml');
 for(const p of ['manifest.webmanifest','sw.js','pwa2027.mjs','pwa2027.css','icons/*.png']){
  assert.ok(workflow.includes(p),'missing PWA deployment: '+p);
 }
});

test('realistic 249 KB teacher passport WebP saves successfully without decoding the full image',async()=>{
 const {cookie,call}=fixture();
 const admin=await cookie('admin@gmail.com');
 const bytes=Buffer.alloc(249*1024,16);
 bytes.write('RIFF',0,'ascii');
 bytes.writeUInt32LE(bytes.length-8,4);
 bytes.write('WEBP',8,'ascii');
 bytes.write('VP8 ',12,'ascii');
 const photo='data:image/webp;base64,'+bytes.toString('base64');
 const stored=await call('registration2027/teachers/save',{
  who:admin,method:'POST',body:{kelas:'Ruby',namaGuru:'Airin Bin Alin',gambarPasport:photo}
 });
 assert.equal(stored.status,200);
 assert.equal((await stored.json()).photoSaved,true);
 const teachers=await (await call('registration2027/teachers',{who:admin})).json();
 assert.equal(teachers.teachers.find(t=>t.kelas==='Ruby').gambarPasport,photo);
 const backend=file('../functions/api/_registration2027.js');
 assert.match(backend,/atob\(base64\.slice\(0,32\)\)/);
 assert.doesNotMatch(backend,/atob\(match\[2\]\)/);
});
test('successful teacher save updates the UI without requiring another successful network request',()=>{
 const html=file('../public/pendaftaran-tahun1-2027/index.html');
 assert.match(html,/if\(teacherPhotoChanged\)payload\.gambarPasport=teacherPhotoData/);
 assert.match(html,/const result=await cloudApi\('teachers\/save',payload\)/);
 assert.match(html,/teachers=teachers\.map\(t=>t\.kelas===kelas\?updated:t\)/);
 assert.match(html,/loadCloudTeachers\(\)\.then\(\(\)=>render\(\)\)\.catch/);
 assert.match(html,/Belum berjaya disimpan:/);
});
