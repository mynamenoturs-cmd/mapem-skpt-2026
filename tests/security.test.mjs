import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {onRequest,CATEGORIES} from '../functions/api/[[path]].js';
const ORIGIN='https://mapem-skpt-2026.pages.dev';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function fixture(){const db=new DatabaseSync(':memory:');db.exec(file('../migrations/0001_init.sql'));db.exec(file('../migrations/0002_google_pwa.sql'));db.exec(file('../migrations/0003_admin_roles.sql'));db.exec(file('../migrations/0004_award_responsibilities.sql'));db.exec(file('../migrations/0005_portal_announcement.sql'));db.exec(file('../migrations/0006_family_hub.sql'));db.exec(file('../migrations/0007_tahap2_classes.sql'));db.exec(file('../migrations/0008_exclude_year6.sql'));db.exec(file('../migrations/0009_activity_logs.sql'));db.exec(file('../migrations/0010_preserve_delima_t2.sql'));
const adapter={prepare(sql){return {bind(...params){const statement=db.prepare(sql);return {first(){return statement.get(...params)||null},all(){return {results:statement.all(...params)}},run(){let result=statement.run(...params);return {meta:{changes:result.changes}}}};},all(){return {results:db.prepare(sql).all()}},first(){return db.prepare(sql).get()||null}}}};
const env={DB:adapter,GOOGLE_CLIENT_ID:'fake.client',GOOGLE_CLIENT_SECRET:'secret',APP_ORIGIN:ORIGIN,ADMIN_EMAILS:'admin@gmail.com'};
async function addLogin(email,name=email){const sub=email;db.prepare('INSERT INTO users(sub,email,name) VALUES(?,?,?)').run(sub,email,name);const sid=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode('fixture:'+email))).toString('hex');const digest=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(sid));const hash=Buffer.from(digest).toString('hex');db.prepare('INSERT INTO sessions(id_hash,user_sub,expires_at) VALUES(?,?,?)').run(hash,sub,Math.floor(Date.now()/1000)+3600);return `${'__Host-mapem_session'}=${sid}`;}
return {db,env,addLogin};}
const request=(route,opts={})=>new Request(ORIGIN+'/api/'+route,{method:opts.method||'GET',headers:{...(opts.cookie?{Cookie:opts.cookie}:{}),...(opts.body!==undefined?{'Content-Type':'application/json',Origin:opts.origin||ORIGIN}:{}),...(opts.headers||{})},body:opts.body!==undefined?JSON.stringify(opts.body):undefined});
const call=(env,route,opts)=>onRequest({request:request(route,opts),env});
const json=async r=>r.json();
test('schema 42 active classes (26+16), 21 award categories and PWA files',()=>{const {db}=fixture();assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes').get().n,42);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year=3').get().n,8);assert.equal(CATEGORIES.length,21);assert.equal(CATEGORIES.filter(c=>c.teacher).length,5);assert.equal(CATEGORIES.filter(c=>!c.teacher).length,16);assert.match(file('../public/manifest.webmanifest'),/"display":"standalone"/);assert.doesNotMatch(file('../public/sw.js'),/caches\.match\('\/api/);});
test('auth, class isolation, drafts, publication and revocation',async()=>{const {db,env,addLogin}=fixture();const admin=await addLogin('admin@gmail.com'),teacher=await addLogin('teacher@gmail.com'),viewer=await addLogin('parent@gmail.com');db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('teacher@gmail.com','1-amber');
assert.equal((await json(await call(env,'me',{cookie:teacher}))).user.role,'teacher');assert.equal((await json(await call(env,'me',{cookie:viewer}))).user.role,'viewer');assert.equal((await json(await call(env,'me',{cookie:admin}))).user.role,'admin');
assert.equal((await call(env,'admin/overview',{cookie:viewer})).status,403);assert.equal((await call(env,'teacher/class',{cookie:viewer})).status,403);
let teacherData=await json(await call(env,'teacher/class',{cookie:teacher}));assert.equal(teacherData.class.id,'1-amber');assert(!teacherData.categories.some(c=>c.id==='cemara'));assert.equal(teacherData.categories.length,1);assert(!teacherData.categories.some(c=>c.id==='uasa'));
assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'uasa',names:['Test murid'],version:0}})).status,403);
assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',origin:'https://evil.example',body:{categoryId:'pbd',names:['Test murid'],version:0}})).status,403);
let saved=await json(await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',names:['Murid Contoh Satu'],version:0}}));assert.equal(saved.version,1);
assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',names:['Murid Contoh Dua'],version:0}})).status,409);
assert.deepEqual((await json(await call(env,'published',{cookie:viewer}))).classes,[]);
assert.equal((await call(env,'admin/class?id=1-amber',{cookie:viewer})).status,403);
assert.equal((await json(await call(env,'admin/class?id=1-amber',{cookie:admin}))).class.published_at,null);
assert.equal((await call(env,'admin/publish',{cookie:admin,method:'POST',body:{classId:'1-amber'}})).status,409);
assert.equal((await call(env,'teacher/submit',{cookie:teacher,method:'POST',body:{}})).status,400);assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',version:1,names:['Murid Contoh Satu','Murid Dua','Murid Tiga','Murid Empat','Murid Lima']}})).status,200);assert.equal((await call(env,'teacher/submit',{cookie:teacher,method:'POST',body:{}})).status,200);
assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',names:['Murid Tiga'],version:1}})).status,423);
assert.equal((await call(env,'admin/publish',{cookie:admin,method:'POST',body:{classId:'1-amber'}})).status,200);
assert.equal(typeof (await json(await call(env,'admin/class?id=1-amber',{cookie:admin}))).class.published_at,'string');
const pub=await json(await call(env,'published',{cookie:viewer}));assert.equal(pub.classes.length,1);assert.equal(pub.classes[0].awards.pbd.length,5);assert.equal(pub.classes[0].awards.pbd[0],'Murid Contoh Satu');
assert.equal((await call(env,'admin/class/status',{cookie:admin,method:'POST',body:{classId:'1-amber',status:'draft'}})).status,200);
assert.equal((await json(await call(env,'published',{cookie:viewer}))).classes.length,0);
assert.equal((await json(await call(env,'admin/class?id=1-amber',{cookie:admin}))).class.published_at,null);
assert.equal((await call(env,'admin/special/save',{cookie:admin,method:'POST',body:{classId:'1-amber',categoryId:'plan',names:['Ikon Contoh'],version:0}})).status,200);
assert.equal((await call(env,'admin/unassign',{cookie:admin,method:'POST',body:{email:'teacher@gmail.com'}})).status,200);
assert.equal((await json(await call(env,'me',{cookie:teacher}))).user.role,'viewer');
assert.equal((await call(env,'teacher/class',{cookie:teacher})).status,403);
});
test('Google OAuth starts with per-browser state, server-side redirect',async()=>{const {env}=fixture();const r=await call(env,'auth/google/start');assert.equal(r.status,302);assert.match(r.headers.get('location'),/^https:\/\/accounts\.google\.com\//);assert.match(r.headers.get('set-cookie'),/__Host-mapem_oauth=/);assert.match(r.headers.get('set-cookie'),/SameSite=Lax/);});

test('only admins can delegate; grants apply to live sessions and revocation is immediate',async()=>{
 const {db,env,addLogin}=fixture();const admin=await addLogin('admin@gmail.com'),teacher=await addLogin('teacher@gmail.com');
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('teacher@gmail.com','1-amber');
 assert.equal((await call(env,'admin/admins',{cookie:teacher})).status,403);
 assert.equal((await call(env,'admin/admins',{cookie:teacher,method:'POST',body:{email:'other@gmail.com'}})).status,403);
 assert.equal((await call(env,'admin/admins',{cookie:admin,method:'POST',origin:'https://evil.example',body:{email:'other@gmail.com'}})).status,403);
 assert.equal((await call(env,'admin/admins',{cookie:admin,method:'POST',body:{email:'not-an-email'}})).status,400);
 assert.equal((await call(env,'admin/admins',{cookie:admin,method:'POST',body:{email:' TEACHER@gmail.com '}})).status,200);
 assert.equal((await json(await call(env,'me',{cookie:teacher}))).user.role,'admin');
 assert.equal((await call(env,'admin/admins',{cookie:admin,method:'POST',body:{email:'teacher@gmail.com'}})).status,409);
 assert.equal((await call(env,'admin/assign',{cookie:admin,method:'POST',body:{email:'teacher@gmail.com',classId:'1-amber'}})).status,200);
 const admins=await json(await call(env,'admin/admins',{cookie:teacher}));assert.equal(admins.admins.length,2);assert.equal(admins.admins.find(a=>a.email==='admin@gmail.com').protected,true);
 assert.equal((await call(env,'admin/admins/revoke',{cookie:teacher,method:'POST',body:{email:'admin@gmail.com'}})).status,403);
 assert.equal((await call(env,'admin/admins/revoke',{cookie:teacher,method:'POST',body:{email:'teacher@gmail.com'}})).status,409);
 assert.equal((await call(env,'admin/admins/revoke',{cookie:admin,method:'POST',body:{email:'teacher@gmail.com'}})).status,200);
 assert.equal((await json(await call(env,'me',{cookie:teacher}))).user.role,'teacher');
 assert.equal((await call(env,'admin/admins',{cookie:teacher})).status,403);
 assert.equal((await call(env,'admin/admins/revoke',{cookie:teacher,method:'POST',body:{email:'other@gmail.com'}})).status,403);
 assert.equal(db.prepare('SELECT count(*) AS n FROM classes').get().n,42);
});

test('responsibilities: five Year 3 GK inputs and legacy specialist records retained but hidden',async()=>{
 const {db,env,addLogin}=fixture(),teacher=await addLogin('teacher@gmail.com');db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('teacher@gmail.com','3-crystal');
 db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run('3-crystal','uasa','["Rekod Lama UASA"]',3);
 const d=await json(await call(env,'teacher/class',{cookie:teacher}));assert.deepEqual(d.categories.map(c=>c.id),['pbd','cemara','kurikulum','kokurikulum','hem']);assert(!d.drafts.uasa);
 assert.equal(db.prepare('SELECT version FROM drafts WHERE category_id=?').get('uasa').version,3);
 assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',names:Array.from({length:6},(_,i)=>'Murid '+i),version:0}})).status,400);
 for(const id of ['uasa','matapelajaran','ains','ains-tokoh','delima','plan','mawar'])assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:id,names:['Murid Contoh'],version:0}})).status,403);
});
test('category assignments support specialists and dual-role teachers; revoke takes effect immediately',async()=>{
 const {db,env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),fitri=await addLogin('fitri@gmail.com'),abby=await addLogin('abby@gmail.com');
 assert.equal((await call(env,'admin/category-assignments',{cookie:fitri,method:'POST',body:{email:'fitri@gmail.com',categoryIds:['uasa']}})).status,403);
 assert.equal((await call(env,'admin/category-assignments',{cookie:admin,method:'POST',body:{email:'fitri@gmail.com',categoryIds:['pbd']}})).status,400);
 assert.equal((await call(env,'admin/category-assignments',{cookie:admin,method:'POST',body:{email:'fitri@gmail.com',categoryIds:['uasa','matapelajaran']}})).status,200);
 assert.equal((await json(await call(env,'me',{cookie:fitri}))).user.role,'specialist');assert.deepEqual((await json(await call(env,'work/overview',{cookie:fitri}))).categories.map(c=>c.id),['uasa','matapelajaran']);
 assert.equal((await call(env,'teacher/class',{cookie:fitri})).status,403);
 assert.equal((await call(env,'work/class?classId=1-amber&categoryId=uasa',{cookie:abby})).status,403);
 assert.equal((await call(env,'work/save',{cookie:fitri,method:'POST',body:{classId:'1-amber',categoryId:'delima',names:['Murid Contoh'],version:0}})).status,403);
 assert.equal((await call(env,'work/save',{cookie:fitri,method:'POST',origin:'https://evil.example',body:{classId:'1-amber',categoryId:'uasa',names:['Murid Contoh'],version:0}})).status,403);
 assert.equal((await call(env,'work/save',{cookie:fitri,method:'POST',body:{classId:'1-amber',categoryId:'uasa',names:['Murid Ujian'],version:0}})).status,200);
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('fitri@gmail.com','1-amber');assert.equal((await json(await call(env,'me',{cookie:fitri}))).user.role,'teacher');assert.equal((await call(env,'work/overview',{cookie:fitri})).status,200);
 assert.equal((await call(env,'admin/category-assignments/revoke',{cookie:admin,method:'POST',body:{email:'fitri@gmail.com',categoryId:'uasa'}})).status,200);
 assert.equal((await call(env,'work/class?classId=1-amber&categoryId=uasa',{cookie:fitri})).status,403);assert.equal((await call(env,'teacher/class',{cookie:fitri})).status,200);
});
test('nominations are isolated from recipients, only selected names publish, total limit two and LP review enforced',async()=>{
 const {db,env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),teacher=await addLogin('teacher@gmail.com');db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('teacher@gmail.com','3-crystal');
 const save=async(categoryId,ns,version=0)=>call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId,names:ns,version}});
 assert.equal((await save('pbd',['Murid Satu','Murid Dua','Murid Tiga','Murid Empat','Murid Lima'])).status,200);
 assert.equal((await save('cemara',['Calon Satu','Calon Dua','Calon Tiga'])).status,200);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM drafts WHERE category_id=?').get('cemara').n,0);
 assert.equal((await call(env,'teacher/submit',{cookie:teacher,method:'POST',body:{}})).status,200);
 const final=async(ns,version=0,confirmedLP=true,classId='3-crystal')=>call(env,'work/save',{cookie:admin,method:'POST',body:{classId,categoryId:'cemara',names:ns,version,confirmedLP}});
 assert.equal((await final(['Calon Satu'],0,false)).status,400);assert.equal((await final(['Bukan Calon'])).status,400);assert.equal((await final(['Calon Satu','Calon Dua','Calon Tiga'])).status,409);
 assert.equal((await final(['Calon Satu','Calon Dua'])).status,200);
 db.prepare('INSERT INTO nominations(class_id,category_id,names_json,version) VALUES(?,?,?,1)').run('3-diamond','cemara','["Calon Empat"]');assert.equal((await final(['Calon Empat'],0,true,'3-diamond')).status,409);
 assert.equal((await call(env,'admin/publish',{cookie:admin,method:'POST',body:{classId:'3-crystal'}})).status,200);
 const parent=await addLogin('parent@gmail.com'),pub=await json(await call(env,'published',{cookie:parent}));assert.deepEqual(pub.classes[0].awards.cemara,['Calon Satu','Calon Dua']);assert(!JSON.stringify(pub).includes('Calon Tiga'));
 assert.equal((await final(['Calon Satu'],1)).status,423);
 assert.equal((await call(env,'admin/class/status',{cookie:admin,method:'POST',body:{classId:'3-crystal',status:'draft'}})).status,200);
 assert.equal((await final(['Calon Satu'],1)).status,200);assert.equal((await final(['Calon Empat'],0,true,'3-diamond')).status,200);
 const csv=await (await call(env,'admin/export',{cookie:admin})).text();assert(!csv.includes('Calon Tiga'));
 assert.equal((await call(env,'work/save',{cookie:admin,method:'POST',body:{classId:'3-crystal',categoryId:'pbd',names:['Calon Satu'],version:0,confirmedLP:true}})).status,403);
});

test('public announcements require admin, explicit publication and optimistic version',async()=>{
 const {env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),viewer=await addLogin('parent@gmail.com');
 assert.deepEqual(await json(await call(env,'portal/announcement')),{announcement:null});
 assert.equal((await call(env,'admin/announcement')).status,401);
 assert.equal((await call(env,'admin/announcement',{cookie:viewer})).status,403);
 const post=(body,cookie=admin,origin=ORIGIN)=>call(env,'admin/announcement',{cookie,origin,method:'POST',body});
 const draft={title:'Makluman contoh',body:'Baris satu\nBaris dua',enabled:false,version:0};
 assert.equal((await post(draft,viewer)).status,403);assert.equal((await post(draft,admin,'https://evil.example')).status,403);
 assert.equal((await post(draft)).status,200);assert.equal((await json(await call(env,'portal/announcement'))).announcement,null);
 assert.equal((await post({...draft,enabled:true})).status,409);
 assert.equal((await post({...draft,enabled:true,version:1})).status,200);
 const pub=await json(await call(env,'portal/announcement'));assert.equal(pub.announcement.body,draft.body);assert(!JSON.stringify(pub).includes('email'));assert(!('version' in pub.announcement));
 assert.equal((await post({...draft,title:'',enabled:true,version:2})).status,400);
 assert.equal((await post({...draft,body:'x'.repeat(3001),version:2})).status,400);
 assert.equal((await post({...draft,version:2})).status,200);assert.equal((await json(await call(env,'portal/announcement'))).announcement,null);
});

test('admins retain own class and category duties; own views remain scoped and obey teacher locks',async()=>{
 const {env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),delegated=await addLogin('delegated@gmail.com');
 const post=(route,body,cookie=admin)=>call(env,route,{cookie,method:'POST',body});
 assert.equal((await call(env,'teacher/class',{cookie:admin})).status,403);
 assert.equal((await call(env,'work/overview?scope=mine',{cookie:admin})).status,403);
 assert.equal((await post('admin/assign',{email:'admin@gmail.com',classId:'1-amber'})).status,200);
 assert.equal((await post('admin/category-assignments',{email:'admin@gmail.com',categoryIds:['uasa','plan']})).status,200);
 let me=(await json(await call(env,'me',{cookie:admin}))).user;assert.equal(me.role,'admin');assert.equal(me.classId,'1-amber');assert.deepEqual(me.categoryIds,['plan','uasa']);
 let own=await json(await call(env,'teacher/class',{cookie:admin}));assert.equal(own.class.id,'1-amber');assert.equal(own.categories.length,1);
 const ns=['Murid Ujian Satu','Murid Ujian Dua','Murid Ujian Tiga','Murid Ujian Empat','Murid Ujian Lima'];
 assert.equal((await post('teacher/save',{classId:'2-crystal',categoryId:'pbd',names:ns,version:0})).status,200);
 assert.deepEqual((await json(await call(env,'teacher/class?classId=2-crystal',{cookie:admin}))).drafts.pbd.names,ns);
 assert.equal((await post('teacher/save',{categoryId:'uasa',names:['Murid Ujian'],version:0})).status,403);
 assert.equal((await post('teacher/submit',{})).status,200);
 assert.equal((await post('teacher/save',{categoryId:'pbd',names:ns,version:1})).status,423);
 assert.equal((await call(env,'admin/overview',{cookie:admin})).status,200);
 own=await json(await call(env,'work/overview?scope=mine',{cookie:admin}));assert.deepEqual(own.categories.map(c=>c.id),['uasa','plan']);
 assert.equal((await call(env,'work/class?classId=1-amber&categoryId=delima&scope=mine',{cookie:admin})).status,403);
 assert.equal((await post('work/save?scope=mine',{classId:'1-amber',categoryId:'delima',names:['Murid Ujian'],version:0})).status,403);
 assert.equal((await post('work/save?scope=mine',{classId:'1-amber',categoryId:'uasa',names:['Murid Ujian'],version:0})).status,200);
 assert.equal((await call(env,'work/overview',{cookie:admin})).status,200);assert.equal((await json(await call(env,'work/overview',{cookie:admin}))).categories.length,20);
 assert.equal((await post('admin/admins',{email:'delegated@gmail.com'})).status,200);
 assert.equal((await post('admin/assign',{email:'delegated@gmail.com',classId:'2-crystal'})).status,200);
 assert.equal((await post('admin/category-assignments',{email:'delegated@gmail.com',categoryIds:['plan']})).status,200);
 assert.equal((await call(env,'teacher/class',{cookie:delegated})).status,200);
 assert.equal((await post('admin/admins/revoke',{email:'delegated@gmail.com'})).status,200);
 me=(await json(await call(env,'me',{cookie:delegated}))).user;assert.equal(me.role,'teacher');assert.equal(me.classId,'2-crystal');assert.deepEqual(me.categoryIds,['plan']);
 assert.equal((await call(env,'admin/overview',{cookie:delegated})).status,403);
 assert.equal((await post('admin/unassign',{email:'admin@gmail.com'})).status,200);assert.equal((await call(env,'teacher/class',{cookie:admin})).status,403);
 assert.equal((await post('admin/category-assignments/revoke',{email:'admin@gmail.com',categoryId:'plan'})).status,200);
 assert.equal((await call(env,'work/class?classId=1-amber&categoryId=plan&scope=mine',{cookie:admin})).status,403);
 assert.equal((await call(env,'work/class?classId=1-amber&categoryId=plan',{cookie:admin})).status,200);
});

test('every GK year gets the correct inputs; old Year 1/2 nominations are preserved but unusable',async()=>{
 const {db,env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com');
 for(const year of [1,2,3]){
  const email='teacher'+year+'@gmail.com',cookie=await addLogin(email),classId=year+'-crystal';db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run(email,classId);
  db.prepare('INSERT INTO nominations(class_id,category_id,names_json,version) VALUES(?,?,?,2)').run(classId,'cemara','["Calon Ujian Lama"]');
  let d=await json(await call(env,'teacher/class',{cookie}));assert.equal(d.categories.length,year===3?5:1);assert.equal(!!d.drafts.cemara,year===3);
  for(const id of ['cemara','kurikulum','kokurikulum','hem']){
   const save=await call(env,'teacher/save',{cookie,method:'POST',body:{categoryId:id,names:['Calon Ujian'],version:id==='cemara'?2:0}});assert.equal(save.status,year===3?200:403);
   const final=await call(env,'work/class?classId='+classId+'&categoryId='+id,{cookie:admin});assert.equal(final.status,year===3?200:403);
  }
  if(year<3)assert.equal(db.prepare('SELECT version FROM nominations WHERE class_id=? AND category_id=?').get(classId,'cemara').version,2);
 }
 // Ineligible historical final rows must not consume the Year 3 quota or appear in current export.
 db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,1)').run('1-crystal','cemara','["Rekod Lama Satu","Rekod Lama Dua"]');
 const d=await json(await call(env,'work/class?classId=3-crystal&categoryId=cemara',{cookie:admin}));assert.deepEqual(d.nominees.map(n=>n.classId),['3-crystal']);
 assert.equal((await call(env,'work/save',{cookie:admin,method:'POST',body:{classId:'3-crystal',categoryId:'cemara',names:['Calon Ujian'],version:0,confirmedLP:true}})).status,200);
 assert(!((await (await call(env,'admin/export',{cookie:admin})).text()).includes('Rekod Lama Satu')));
 assert.equal(db.prepare('SELECT version FROM drafts WHERE class_id=? AND category_id=?').get('1-crystal','cemara').version,1);
 db.prepare('INSERT INTO publications(class_id,snapshot_json,published_by) VALUES(?,?,?)').run('1-crystal','{"cemara":["Rekod Lama Satu"]}','admin@gmail.com');
 assert(!JSON.stringify(await json(await call(env,'published',{cookie:admin}))).includes('Rekod Lama Satu'));
});

test('event info is admin-edited, explicitly published, versioned, and contains no recipient records',async()=>{
 const {env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),viewer=await addLogin('parent@gmail.com');
 assert.deepEqual(await json(await call(env,'portal/event')),{event:null});assert.equal((await call(env,'admin/event')).status,401);assert.equal((await call(env,'admin/event',{cookie:viewer})).status,403);
 const event={title:'Majlis Ujian <b>literal</b>',date:'2026-11-07',time:'07:00',venue:'Dewan Ujian',dresscode:'Songket',schedule:'07:00 | Pendaftaran\n08:00 | Majlis',guidance:'Panduan umum'};
 const save=(body,cookie=admin,origin=ORIGIN)=>call(env,'admin/event',{cookie,origin,method:'POST',body});
 assert.equal((await save({event,enabled:true,version:0},viewer)).status,403);assert.equal((await save({event,enabled:true,version:0},admin,'https://evil.example')).status,403);
 assert.equal((await save({event,enabled:false,version:0})).status,200);assert.equal((await json(await call(env,'portal/event'))).event,null);
 assert.equal((await save({event,enabled:true,version:0})).status,409);assert.equal((await save({event:{...event,date:'2026-02-30'},enabled:true,version:1})).status,400);
 assert.equal((await save({event:{...event,time:'25:00'},enabled:true,version:1})).status,400);assert.equal((await save({event:{...event,venue:''},enabled:true,version:1})).status,400);
 assert.equal((await save({event:{...event,schedule:'x'.repeat(6001)},enabled:true,version:1})).status,400);
 assert.equal((await save({event,enabled:true,version:1})).status,200);assert.deepEqual((await json(await call(env,'portal/event'))).event,event);
 assert.equal((await call(env,'published')).status,401);assert.deepEqual((await json(await call(env,'published',{cookie:viewer}))).classes,[]);
 assert.equal((await save({event,enabled:false,version:2})).status,200);assert.equal((await json(await call(env,'portal/event'))).event,null);
});

test('export is admin-only, category-sorted, year-filtered and uses actual published snapshots',async()=>{
 const {db,env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),viewer=await addLogin('parent@gmail.com');
 assert.equal((await call(env,'admin/export?format=json')).status,401);assert.equal((await call(env,'admin/export?format=json',{cookie:viewer})).status,403);
 for(const [cls,cat,ns] of [['2-crystal','uasa',['Zula Ujian','Aina Ujian']],['1-amber','pbd',['PBD Ujian']],['1-amber','cemara',['Lama Tidak Layak']]])db.prepare('INSERT INTO drafts(class_id,category_id,names_json) VALUES(?,?,?)').run(cls,cat,JSON.stringify(ns));
 db.prepare('INSERT INTO nominations(class_id,category_id,names_json) VALUES(?,?,?)').run('3-crystal','cemara','["Calon Belum Dipilih"]');db.prepare('INSERT INTO publications(class_id,snapshot_json,published_by) VALUES(?,?,?)').run('2-crystal','{"uasa":["Nama Rasmi"]}','admin@gmail.com');
 const get=async q=>json(await call(env,'admin/export?format=json'+q,{cookie:admin}));let d=await get('');assert.deepEqual(d.rows.map(r=>r.name),['PBD Ujian','Aina Ujian','Zula Ujian']);assert(!JSON.stringify(d).includes('Calon Belum Dipilih'));assert.equal(d.categories.length,21);
 d=await get('&year=2');assert.equal(d.rows.length,2);d=await get('&source=published');assert.deepEqual(d.rows.map(r=>r.name),['Nama Rasmi']);assert.equal(d.rows[0].publication,'Diterbitkan');
 assert.equal((await get('&source=published&year=1')).rows.length,0);assert.equal((await call(env,'admin/export?format=json&year=7',{cookie:admin})).status,400);assert.equal((await call(env,'admin/export?source=other',{cookie:admin})).status,400);
 const csv=await (await call(env,'admin/export',{cookie:admin})).text();assert.match(csv,/Kategori Anugerah/);assert(csv.indexOf('PBD Ujian')<csv.indexOf('Aina Ujian'));assert(csv.indexOf('Aina Ujian')<csv.indexOf('Zula Ujian'));
});


test('Tahap 2 has exactly 16 classes (Year 4 and 5 only), with PBD entered by class teacher',async()=>{
 const {db,env,addLogin}=fixture(),teacher=await addLogin('guru.tahap2@gmail.com'),admin=await addLogin('admin@gmail.com');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year IN (4,5)').get().n,16);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year=6').get().n,0);
 for(const year of [4,5]){
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year=?').get(year).n,8);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year=? AND name=?').get(year,'Amber').n,0);
 }
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('guru.tahap2@gmail.com','5-crystal');
 const data=await json(await call(env,'teacher/class',{cookie:teacher}));
 assert.equal(data.class.year,5);
 assert.deepEqual(data.categories.map(x=>x.id),['pbd']);
 assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'uasa',version:0,names:['Murid Satu']}})).status,403);
 const names=Array.from({length:5},(_,i)=>'Nama Murid '+(i+1));
 assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',version:0,names}})).status,200);
 assert.equal((await call(env,'teacher/submit',{cookie:teacher,method:'POST',body:{}})).status,200);
 const tahap1=await json(await call(env,'admin/export?format=json&tahap=1',{cookie:admin}));
 const tahap2=await json(await call(env,'admin/export?format=json&tahap=2',{cookie:admin}));
 const all=await json(await call(env,'admin/export?format=json&tahap=0',{cookie:admin}));
 assert.equal(tahap1.rows.length,0);assert.equal(tahap2.rows.length,5);assert.equal(all.rows.length,5);
 assert(tahap2.rows.every(r=>r.year===4||r.year===5));
 assert.equal((await call(env,'admin/export?format=json&tahap=1&year=6',{cookie:admin})).status,400);
 assert.equal((await call(env,'admin/export?format=json&tahap=2&year=6',{cookie:admin})).status,400);
 assert.equal((await call(env,'admin/class?id=6-crystal',{cookie:admin})).status,400);
 const overview=await json(await call(env,'admin/overview',{cookie:admin}));
 assert.equal(overview.classes.length,42);
 assert(overview.classes.every(c=>c.year<=5));
});
test('Year 6 historical records are retained but excluded from active portal and exports',async()=>{
 const {db,env,addLogin}=fixture();
 db.exec("INSERT INTO classes(id,year,name) VALUES('6-crystal',6,'Crystal')");
 db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run('6-crystal','pbd','["Arkib Murid"]',1);
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('arkib@example.com','6-crystal');
 db.prepare('INSERT INTO publications(class_id,snapshot_json,published_by) VALUES(?,?,?)').run('6-crystal','{"pbd":["Arkib Murid"]}','admin@example.com');
 db.exec(file('../migrations/0008_exclude_year6.sql'));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes WHERE year=6').get().n,1);
 assert.equal(db.prepare('SELECT names_json FROM drafts WHERE class_id=?').get('6-crystal').names_json,'["Arkib Murid"]');
 const admin=await addLogin('admin@gmail.com'),archive=await addLogin('arkib@example.com');
 assert.equal((await json(await call(env,'me',{cookie:archive}))).user.role,'viewer');
 const overview=await json(await call(env,'admin/overview',{cookie:admin}));
 assert.equal(overview.classes.length,42);
 const exported=await json(await call(env,'admin/export?format=json&tahap=0',{cookie:admin}));
 assert(!exported.rows.some(x=>x.year===6));
 const published=await json(await call(env,'published',{cookie:admin}));
 assert(!published.classes.some(x=>x.year===6));
});
test('migration preserved original classroom data, assignments, nomination and published snapshots',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init','0002_google_pwa','0003_admin_roles','0004_award_responsibilities','0005_portal_announcement','0006_family_hub'])db.exec(file('../migrations/'+name+'.sql'));
 db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run('1-amber','pbd','["Murid Asal"]',5);
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('guruasal@example.com','1-amber');
 db.prepare('INSERT INTO nominations(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run('3-crystal','cemara','["Calon Asal"]',3);
 db.prepare('INSERT INTO final_reviews(class_id,category_id,version,confirmed_by) VALUES(?,?,?,?)').run('3-crystal','cemara',2,'admin@example.com');
 db.prepare('INSERT INTO publications(class_id,snapshot_json,published_by) VALUES(?,?,?)').run('1-amber','{"pbd":["Murid Asal"]}','admin@example.com');
 db.exec(file('../migrations/0007_tahap2_classes.sql'));
 db.exec(file('../migrations/0008_exclude_year6.sql'));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM classes').get().n,42);
 assert.equal(db.prepare('SELECT version FROM drafts WHERE class_id=?').get('1-amber').version,5);
 assert.equal(db.prepare('SELECT class_id FROM teacher_assignments WHERE email=?').get('guruasal@example.com').class_id,'1-amber');
 assert.equal(db.prepare('SELECT names_json FROM nominations WHERE class_id=?').get('3-crystal').names_json,'["Calon Asal"]');
 assert.equal(db.prepare('SELECT version FROM final_reviews WHERE class_id=?').get('3-crystal').version,2);
 assert.equal(db.prepare('SELECT snapshot_json FROM publications WHERE class_id=?').get('1-amber').snapshot_json,'{"pbd":["Murid Asal"]}');
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('new school award quotas and owners do not merge MAWAR and Navigator records',()=>{
 assert.equal(CATEGORIES.length,21);
 const of=id=>CATEGORIES.find(c=>c.id===id);
 assert.deepEqual(of('mawar-lonjakan').quota,{2:10,3:14,4:2,5:4});
 assert.equal(of('mawar-lonjakan').owner,'Cikgu Norbaizura');
 assert.equal(of('mawar').quota[3],2);
 assert.equal(of('delima').quota,3);
 assert.deepEqual(of('delima').years,[1,2,3]);
 assert.equal(of('delima-tokoh-t2').quota,3);
 assert.deepEqual(of('delima-tokoh-t2').years,[4,5]);
 assert.equal(of('plan').quota,6);
 assert.equal(of('plan').sharedAcrossStages,true);
 assert.equal(of('plan').owner,'Cikgu Puja');
 assert.equal(of('ains-tokoh-t2').quota,3);
});
test('audit captures teacher edits and admin correction with exact name differences, not viewer-readable',async()=>{
 const {db,env,addLogin}=fixture();
 const teacher=await addLogin('gurucontoh@example.com'),admin=await addLogin('admin@gmail.com'),viewer=await addLogin('ibubapa@example.com');
 db.prepare('INSERT INTO teacher_assignments(email,class_id) VALUES(?,?)').run('gurucontoh@example.com','4-crystal');
 const names=['Murid Satu','Murid Dua','Murid Tiga','Murid Empat','Murid Lima'];
 assert.equal((await call(env,'teacher/save',{cookie:teacher,method:'POST',body:{categoryId:'pbd',version:0,names}})).status,200);
 const log=db.prepare('SELECT actor_email,action,before_json,after_json FROM activity_logs WHERE class_id=? ORDER BY id DESC').get('4-crystal');
 assert.equal(log.actor_email,'gurucontoh@example.com');
 assert.equal(log.action,'isi_nama');assert.deepEqual(JSON.parse(log.after_json),names);
 assert.equal((await call(env,'admin/audit',{cookie:viewer})).status,403);
 assert.equal((await call(env,'admin/audit',{cookie:teacher})).status,403);
 assert.equal((await call(env,'admin/correct',{cookie:viewer,method:'POST',body:{classId:'4-crystal',categoryId:'pbd',names:names.slice(0,4),version:1,reason:'Tersalah nama'}})).status,403);
 assert.equal((await call(env,'admin/correct',{cookie:admin,method:'POST',body:{classId:'4-crystal',categoryId:'pbd',names:names.slice(0,4),version:1,reason:'Tersalah nama murid kelima'}})).status,200);
 const audit=await json(await call(env,'admin/audit?tahap=2',{cookie:admin}));
 const latest=audit.logs[0];assert.equal(latest.actor_email,'admin@gmail.com');assert.equal(latest.action,'padam_nama');
 assert.deepEqual(JSON.parse(latest.before_json),names);assert.deepEqual(JSON.parse(latest.after_json),names.slice(0,4));
 assert.match(latest.note,/Tersalah nama/);
 assert.equal((await call(env,'admin/audit?tahap=1',{cookie:admin})).status,200);
 assert.equal((await call(env,'admin/correct',{cookie:admin,method:'POST',body:{classId:'4-crystal',categoryId:'uasa',names:[],version:0,reason:'Betulkan nama'}})).status,400);
 assert.equal((await call(env,'admin/correct',{cookie:admin,method:'POST',body:{classId:'4-crystal',categoryId:'pbd',names:[],version:2,reason:'Betulkan nama'}})).status,200);
 const del=db.prepare('SELECT action FROM activity_logs WHERE class_id=? ORDER BY id DESC LIMIT 1').get('4-crystal');
 assert.equal(del.action,'kosongkan_nama');
});
test('stage-specific specialist permissions cannot cross from Tahap 2 into Tahap 1',async()=>{
 const {env,addLogin}=fixture(),admin=await addLogin('admin@gmail.com'),specialist=await addLogin('fenny@example.com');
 assert.equal((await call(env,'admin/category-assignments',{cookie:admin,method:'POST',body:{email:'fenny@example.com',categoryIds:['uasa'],tahap:2}})).status,200);
 const denied=await call(env,'work/save?scope=mine',{cookie:specialist,method:'POST',body:{classId:'2-crystal',categoryId:'uasa',names:['Contoh Murid'],version:0}});
 assert.equal(denied.status,403);
 const allowed=await call(env,'work/save?scope=mine',{cookie:specialist,method:'POST',body:{classId:'4-crystal',categoryId:'uasa',names:['Contoh Murid'],version:0}});
 assert.equal(allowed.status,200);
});

test('verified one-time migration moves exactly 30 PLaN names to Lonjakan M.A.W.A.R without mixing years or losing audit',()=>{
 const {db}=fixture();
 const groups=[
  ['2-crystal',5],['2-diamond',5],
  ['3-crystal',7],['3-diamond',7],
  ['4-crystal',2],['5-crystal',4]
 ];
 for(const [id,count] of groups){
  const names=Array.from({length:count},(_,i)=>'Murid '+id+' '+(i+1));
  db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version,updated_by,editor_role) VALUES(?,?,?,?,?,?)').run(id,'plan',JSON.stringify(names),2,'guruasal@example.com','specialist');
 }
 const script=file('../migrations/0011_move_plan_to_mawar.sql');
 db.exec(script);
 const sum=(category,year)=>db.prepare('SELECT COALESCE(SUM(json_array_length(d.names_json)),0) AS n FROM drafts d JOIN classes c ON c.id=d.class_id WHERE d.category_id=? AND c.year=?').get(category,year).n;
 for(const [year,count] of [[2,10],[3,14],[4,2],[5,4]]){
   assert.equal(sum('plan',year),0);
   assert.equal(sum('mawar-lonjakan',year),count);
 }
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM award_reassignment_archive").get().n,6);
 assert.equal(db.prepare("SELECT COALESCE(SUM(json_array_length(names_json)),0) AS n FROM award_reassignment_archive").get().n,30);
 for(const [classId,count] of groups){
   const archived=db.prepare('SELECT names_json FROM award_reassignment_archive WHERE class_id=?').get(classId);
   const moved=db.prepare("SELECT names_json FROM drafts WHERE category_id='mawar-lonjakan' AND class_id=?").get(classId);
   assert.deepEqual(JSON.parse(moved.names_json),JSON.parse(archived.names_json));
   assert.equal(JSON.parse(moved.names_json).length,count);
 }
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM activity_logs WHERE actor_email='system/approved-migration'").get().n,12);
});
test('MAWAR reassignment refuses to clear PLaN if 30 recipients and year quotas do not match',()=>{
 const {db}=fixture();
 db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run('2-crystal','plan','["Nama Ujian"]',1);
 assert.throws(()=>db.exec(file('../migrations/0011_move_plan_to_mawar.sql')),/CHECK constraint failed|constraint failed/i);
 assert.equal(db.prepare('SELECT names_json FROM drafts WHERE class_id=? AND category_id=?').get('2-crystal','plan').names_json,'["Nama Ujian"]');
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM drafts WHERE category_id='mawar-lonjakan'").get().n,0);
});
