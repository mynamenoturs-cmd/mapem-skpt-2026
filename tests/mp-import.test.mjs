import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/admin/mp/bulk.js';
const origin='https://mapem.example';
const sub=['bm','bi','mt','sn','pai','pm'];
async function fixture(){
const db=new DatabaseSync(':memory:');
db.exec("CREATE TABLE classes(id TEXT PRIMARY KEY,year INTEGER,name TEXT);CREATE TABLE users(sub TEXT PRIMARY KEY,email TEXT);CREATE TABLE sessions(id_hash TEXT,user_sub TEXT,expires_at INTEGER);CREATE TABLE admin_grants(email TEXT);CREATE TABLE drafts(class_id TEXT,category_id TEXT,names_json TEXT,version INTEGER,updated_at TEXT,updated_by TEXT,editor_role TEXT,edit_note TEXT,PRIMARY KEY(class_id,category_id));CREATE TABLE publications(class_id TEXT PRIMARY KEY);CREATE TABLE activity_logs(actor_email TEXT,actor_role TEXT,action TEXT,class_id TEXT,category_id TEXT,note TEXT,source_table TEXT);");
const classes=[];
for(const year of [1,2,3])for(const cl of ['amber','crystal','diamond','emerald','jade','pearl','ruby','sapphire','topaz']){
 if(year===3&&cl==='amber')continue;const id=year+'-'+cl;classes.push({id,year,cl});db.prepare('INSERT INTO classes VALUES(?,?,?)').run(id,year,cl);
}
const cookie='a'.repeat(64),hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(cookie))).toString('hex');
db.prepare('INSERT INTO users VALUES(?,?)').run('admin','admin@example.com');
db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash,'admin',Math.floor(Date.now()/1000)+3600);
const records=[];
for(const y of [1,2,3])for(const s of sub)for(let i=0;i<5;i++){
 const cls=classes.filter(x=>x.year===y)[i];records.push({classId:cls.id,categoryId:'subjek-'+s,names:['MURID '+y+' '+s+' '+i]});
}
const DB={prepare(sql){return{bind(...args){const statement=db.prepare(sql);return{first(){return statement.get(...args)||null},all(){return{results:statement.all(...args)}},run(){return{meta:{changes:statement.run(...args).changes}}},stmt:statement,args}},all(){return{results:db.prepare(sql).all()}}}},
async batch(items){db.exec('BEGIN IMMEDIATE');try{const result=items.map(x=>x.stmt.reader?{results:x.stmt.all(...x.args)}:{meta:x.stmt.run(...x.args)});db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
};
const env={DB,APP_ORIGIN:origin,ADMIN_EMAILS:'admin@example.com'};
const data={schemaVersion:1,award:'matapelajaran',records};
async function call(body,token=cookie,host=origin){
const request=new Request(origin+'/api/admin/mp/bulk',{method:'POST',headers:{Origin:host,Cookie:'__Host-mapem_session='+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
const r=await onRequestPost({request,env});return {status:r.status,result:await r.json()};
}
return {db,call,data,cookie};
}
test('MP importer requires admin and enforces 5 per subject/year while allowing legitimate cross-subject winners',async()=>{
const t=await fixture();
assert.equal((await t.call({...t.data,mode:'preview'},'invalid')).status,401);
assert.equal((await t.call({...t.data,mode:'preview'},t.cookie,'https://evil.example')).status,403);
const missing=structuredClone(t.data);missing.records.pop();
assert.equal((await t.call({...missing,mode:'preview'})).status,400);
const repeat=structuredClone(t.data);repeat.records[5].names[0]=repeat.records[0].names[0];
assert.equal(repeat.records[5].classId,repeat.records[0].classId);
const repeatedPreview=await t.call({...repeat,mode:'preview'});
assert.equal(repeatedPreview.status,200);
assert.equal(repeatedPreview.result.recipients,90);
assert.equal(repeatedPreview.result.uniqueStudents,89);
assert.equal(repeatedPreview.result.repeatedSubjectStudents,1);
const p=await t.call({...t.data,mode:'preview'});assert.equal(p.status,200);
assert.equal(p.result.recipients,90);assert.equal(p.result.uniqueStudents,90);assert.equal(p.result.categories,18);
assert.equal(p.result.changes.length,90);
assert.equal((await t.call({...t.data,mode:'commit',confirm:true,expectedVersions:{}})).status,409);
assert.equal(t.db.prepare('SELECT count(*) n FROM drafts').get().n,0);
});
test('MP importer detects PBD overlap, blocks published classes and saves transactionally',async()=>{
const t=await fixture();
const target=t.data.records[0];
t.db.prepare('INSERT INTO drafts(class_id,category_id,names_json,version) VALUES(?,?,?,?)').run(target.classId,'pbd',JSON.stringify(target.names),1);
const p=await t.call({...t.data,mode:'preview'});
assert.equal(p.status,200);assert.equal(p.result.overlaps.length,1);
assert.equal(p.result.overlaps[0].otherAwards[0],'pbd');
assert.equal((await t.call({...t.data,mode:'commit',confirm:true,expectedVersions:p.result.expectedVersions})).status,409);
assert.equal(t.db.prepare('SELECT count(*) n FROM drafts WHERE category_id LIKE ?',).get('subjek-%').n,0);
const saved=await t.call({...t.data,mode:'commit',confirm:true,expectedVersions:p.result.expectedVersions,allowOverlaps:true});
assert.equal(saved.status,200);assert.equal(saved.result.saved,90);
assert.equal(t.db.prepare('SELECT count(*) n FROM drafts WHERE category_id LIKE ?').get('subjek-%').n,90);
assert.equal(t.db.prepare('SELECT names_json FROM drafts WHERE category_id=? AND class_id=?').get('pbd',target.classId).names_json,JSON.stringify(target.names));
t.db.prepare('INSERT INTO publications(class_id) VALUES(?)').run('1-amber');
const again=await t.call({...t.data,mode:'preview'});assert(again.result.locked.includes('1-amber'));
assert.equal((await t.call({...t.data,mode:'commit',confirm:true,expectedVersions:again.result.expectedVersions,allowOverlaps:true})).status,423);
});
