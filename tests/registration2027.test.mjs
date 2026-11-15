import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {onRequest} from '../functions/api/[[path]].js';
const ORIGIN='https://mapem-skpt-2026.pages.dev';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const migration of ['0001_init.sql','0002_google_pwa.sql','0003_admin_roles.sql','0004_award_responsibilities.sql','0016_registration_tahun1_2027.sql'])db.exec(file('../migrations/'+migration));
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
