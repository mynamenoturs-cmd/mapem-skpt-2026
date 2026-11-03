import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequestPost} from '../functions/api/admin/uasa/bulk.js';
import {webcrypto} from 'node:crypto';

async function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE classes(id TEXT PRIMARY KEY,year INTEGER,name TEXT,updated_at TEXT);CREATE TABLE users(sub TEXT PRIMARY KEY,email TEXT);CREATE TABLE sessions(id_hash TEXT,user_sub TEXT,expires_at INTEGER);CREATE TABLE admin_grants(email TEXT);CREATE TABLE drafts(class_id TEXT,category_id TEXT,names_json TEXT,version INTEGER,updated_at TEXT,updated_by TEXT,editor_role TEXT,edit_note TEXT,PRIMARY KEY(class_id,category_id));CREATE TABLE publications(class_id TEXT PRIMARY KEY);CREATE TABLE activity_logs(actor_email TEXT,actor_role TEXT,action TEXT,class_id TEXT,category_id TEXT,note TEXT,source_table TEXT);");
 const names={};for(const y of [1,2,3])for(const cl of ['amber','crystal','diamond','emerald','jade','pearl','ruby','sapphire','topaz']){
  if(y===3&&cl==='amber')continue;const id=y+'-'+cl;
  db.prepare('INSERT INTO classes(id,year,name) VALUES(?,?,?)').run(id,y,cl);
  names[id]=['MURID CONTOH '+y+' '+cl];
 }
 names['1-amber'].push('MURID CONTOH TAMBAHAN 1');
 names['2-amber'].push('MURID CONTOH TAMBAHAN 2');
 names['3-ruby'].push('MURID CONTOH TAMBAHAN 3');
 names['3-emerald'].push('MURID CONTOH TAMBAHAN 4');
 const cookie='b'.repeat(64);
 const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(cookie))).toString('hex');
 db.prepare('INSERT INTO users VALUES(?,?)').run('admin','admin@example.com');
 db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,'admin',Math.floor(Date.now()/1000)+3600);
 const DB={
  prepare(sql){return{bind(...args){const st=db.prepare(sql);return{first(){return st.get(...args)||null},all(){return{results:st.all(...args)}},run(){return{meta:{changes:st.run(...args).changes}}},stmt:st,args}},all(){return{results:db.prepare(sql).all()}}}},
  async batch(statements){db.exec('BEGIN IMMEDIATE');try{const out=statements.map(s=>s.stmt.reader?{results:s.stmt.all(...s.args)}:{meta:s.stmt.run(...s.args)});db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}
 };
 const env={DB,APP_ORIGIN:'https://mapem.example',ADMIN_EMAILS:'admin@example.com'};
 const data={schemaVersion:1,award:'uasa',records:Object.entries(names).map(([classId,names])=>({classId,names}))};
 async function call(body,token=cookie,origin='https://mapem.example'){
  const req=new Request('https://mapem.example/api/admin/uasa/bulk',{method:'POST',headers:{Origin:origin,Cookie:'__Host-mapem_session='+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const res=await onRequestPost({request:req,env});return{status:res.status,data:await res.json()};
 }
 return{db,env,call,data,cookie};
}

test('UASA import: admin-only, origin-bound, quota-validated and transactionally saved',async()=>{
 const f=await fixture();
 assert.equal((await f.call({...f.data,mode:'preview'},'bad-token')).status,401);
 assert.equal((await f.call({...f.data,mode:'preview'},f.cookie,'https://other.example')).status,403);
 const wrong=structuredClone(f.data);wrong.records[0].names.pop();
 assert.equal((await f.call({...wrong,mode:'preview'})).status,400);
 const p=await f.call({...f.data,mode:'preview'});
 assert.equal(p.status,200);
 assert.deepEqual(p.data.totals,{1:10,2:10,3:10});
 assert.equal(p.data.changed.length,26);
 assert.equal((await f.call({...f.data,mode:'commit',confirm:true,expectedVersions:{...p.data.expectedVersions,'1-amber':3}})).status,409);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM drafts').get().n,0);
 const committed=await f.call({...f.data,mode:'commit',confirm:true,expectedVersions:p.data.expectedVersions});
 assert.equal(committed.status,200);
 assert.equal(committed.data.saved,30);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM drafts').get().n,26);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM activity_logs').get().n,1);
 assert.equal((await f.call({...f.data,mode:'commit',confirm:true,expectedVersions:p.data.expectedVersions})).status,409);
 const next=await f.call({...f.data,mode:'preview'});assert.equal(next.data.changed.length,0);
 f.db.prepare('INSERT INTO publications(class_id) VALUES(?)').run('1-topaz');
 assert.equal((await f.call({...f.data,mode:'commit',confirm:true,expectedVersions:next.data.expectedVersions})).status,423);
});
