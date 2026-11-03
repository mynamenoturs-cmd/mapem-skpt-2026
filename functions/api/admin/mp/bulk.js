// Import 5 Mata Pelajaran Terbaik, protected by MaPeM Google Admin session.
// Private student names are never committed to GitHub.
const headers={'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const subjects=['subjek-bm','subjek-bi','subjek-mt','subjek-sn','subjek-pai','subjek-pm'];
const norm=x=>String(x||'').trim().replace(/\s+/g,' ');
const low=x=>norm(x).toLocaleLowerCase('ms');
const k=(cls,sub)=>cls+'|'+sub;
async function admin(request,env){
 if(!env.DB||!env.APP_ORIGIN)throw{status:503,message:'Konfigurasi portal belum lengkap.'};
 if(request.headers.get('origin')!==String(env.APP_ORIGIN).replace(/\/$/,''))throw{status:403,message:'Origin tidak dibenarkan.'};
 const cookie=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-mapem_session='));
 const token=cookie?.slice('__Host-mapem_session='.length);
 if(!token||!/^[0-9a-f]{64}$/.test(token))throw{status:401,message:'Log masuk Google diperlukan.'};
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
 const r=await env.DB.prepare('SELECT u.email FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(hash,Math.floor(Date.now()/1000)).first();
 if(!r?.email)throw{status:401,message:'Sesi telah tamat.'};
 const email=String(r.email).trim().toLowerCase();
 const admins=new Set(String(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
 if(!admins.has(email)&&!(await env.DB.prepare('SELECT email FROM admin_grants WHERE email=?').bind(email).first()))throw{status:403,message:'Akses pentadbir sahaja.'};
 return email;
}
function parse(body,classes){
 if(body?.schemaVersion!==1||body?.award!=='matapelajaran'||!['preview','commit'].includes(body.mode)||!Array.isArray(body.records))throw{status:400,message:'Format import Mata Pelajaran tidak sah.'};
 const allowed=new Map(classes.map(x=>[x.id,x])),desired=new Map(),byYearSub=new Map(),seen=new Set();
 for(const r of body.records){
  if(!r||!allowed.has(r.classId)||!subjects.includes(r.categoryId)||desired.has(k(r.classId,r.categoryId)))throw{status:400,message:'Kelas atau subjek tidak sah/berulang.'};
  if(!Array.isArray(r.names)||r.names.length<1||r.names.length>5)throw{status:400,message:'Jumlah nama pada kelas/subjek tidak sah.'};
  const names=r.names.map(norm),year=allowed.get(r.classId).year;
  if(names.some(n=>n.length<2||n.length>160||/[<>]/.test(n))||new Set(names.map(low)).size!==names.length)throw{status:400,message:'Nama murid tidak sah.'};
  for(const name of names){
   const identity=year+'|'+low(name);
   if(seen.has(identity))throw{status:400,message:'Nama murid berulang antara anugerah MP: '+name};
   seen.add(identity);
  }
  desired.set(k(r.classId,r.categoryId),names);
  const label=year+'|'+r.categoryId;byYearSub.set(label,(byYearSub.get(label)||0)+names.length);
 }
 if(seen.size!==90)throw{status:400,message:'Diperlukan 90 nama calon unik.'};
 for(const year of [1,2,3])for(const s of subjects)if(byYearSub.get(year+'|'+s)!==5)throw{status:400,message:'Kuota 5 tidak dipenuhi: '+year+' '+s};
 return desired;
}
export async function onRequestPost({request,env}){
 try{
  const email=await admin(request,env);
  if(!request.headers.get('content-type')?.includes('application/json'))throw{status:415,message:'Hantar fail JSON.'};
  const raw=await request.text();if(raw.length>65000)throw{status:413,message:'Fail terlalu besar.'};
  let body;try{body=JSON.parse(raw)}catch{throw{status:400,message:'JSON tidak sah.'}}
  const classes=(await env.DB.prepare('SELECT id,year,name FROM classes WHERE year BETWEEN 1 AND 3 ORDER BY year,name').all()).results||[];
  if(classes.length!==26)throw{status:409,message:'Bilangan kelas Tahap 1 tidak tepat 26.'};
  const desired=parse(body,classes);
  const entries=(await env.DB.prepare("SELECT d.class_id,d.category_id,d.names_json,d.version FROM drafts d JOIN classes c ON c.id=d.class_id WHERE c.year BETWEEN 1 AND 3 AND d.category_id IN ('subjek-bm','subjek-bi','subjek-mt','subjek-sn','subjek-pai','subjek-pm')").all()).results||[];
  const current=new Map(entries.map(x=>[k(x.class_id,x.category_id),x])),changes=[],versions={};
  for(const c of classes)for(const sub of subjects){
   const id=k(c.id,sub),old=current.get(id),existing=JSON.parse(old?.names_json||'[]'),wanted=desired.get(id)||[];
   if(JSON.stringify(existing)!==JSON.stringify(wanted)){
    changes.push({classId:c.id,categoryId:sub,oldCount:existing.length,newCount:wanted.length});
    versions[id]=old?.version??0;
   }
  }
  const published=(await env.DB.prepare('SELECT class_id FROM publications WHERE class_id IN (SELECT id FROM classes WHERE year BETWEEN 1 AND 3)').all()).results||[];
  const locked=published.map(x=>x.class_id);
  const other=(await env.DB.prepare("SELECT d.class_id,d.category_id,d.names_json FROM drafts d JOIN classes c ON c.id=d.class_id WHERE c.year BETWEEN 1 AND 3 AND d.category_id NOT IN ('subjek-bm','subjek-bi','subjek-mt','subjek-sn','subjek-pai','subjek-pm')").all()).results||[];
  const awarded=new Map();
  for(const row of other){
   let names=[];try{names=JSON.parse(row.names_json)}catch{}
   for(const name of names){
    const ident=row.class_id+'|'+low(name);
    if(!awarded.has(ident))awarded.set(ident,new Set());
    awarded.get(ident).add(row.category_id);
   }
  }
  const overlaps=[];
  for(const record of body.records)for(const name of record.names){
   const cats=awarded.get(record.classId+'|'+low(name));
   if(cats)overlaps.push({classId:record.classId,name,subject:record.categoryId,otherAwards:[...cats]});
  }
  if(body.mode==='preview')return respond({ok:true,recipients:90,categories:18,classes:26,changes,expectedVersions:versions,locked,overlaps});
  if(locked.length)throw{status:423,message:'Terdapat kelas sudah diterbitkan: '+locked.join(', ')+'. Tarik balik penerbitan sebelum import.'};
  if(overlaps.length&&!body.allowOverlaps)throw{status:409,message:overlaps.length+' murid sudah menerima kategori anugerah lain. Semak pertindihan atau sahkan pengecualian.'};
  if(body.confirm!==true||!body.expectedVersions||typeof body.expectedVersions!=='object'||Array.isArray(body.expectedVersions))throw{status:400,message:'Pratonton dan sahkan sebelum import.'};
  if(Object.keys(versions).length!==Object.keys(body.expectedVersions).length)throw{status:409,message:'Versi senarai berubah; pratonton semula.'};
  for(const change of changes){
   const id=k(change.classId,change.categoryId);
   if(versions[id]!==body.expectedVersions[id])throw{status:409,message:'Versi kelas/subjek sudah berubah.'};
  }
  if(typeof env.DB.batch!=='function')throw{status:503,message:'Transaksi D1 tidak tersedia.'};
  const batch=[];
  for(const change of changes){
   const id=k(change.classId,change.categoryId);
   batch.push(env.DB.prepare("SELECT CASE WHEN COALESCE((SELECT version FROM drafts WHERE class_id=? AND category_id=?),0)=? AND NOT EXISTS(SELECT 1 FROM publications WHERE class_id=?) THEN 1 ELSE json_extract('{','$') END AS ok").bind(change.classId,change.categoryId,versions[id],change.classId));
   batch.push(env.DB.prepare("INSERT INTO drafts(class_id,category_id,names_json,version,updated_at,updated_by,editor_role,edit_note) VALUES(?,?,?,1,datetime('now'),?,'admin','Import Mata Pelajaran Terbaik') ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=drafts.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by,editor_role=excluded.editor_role,edit_note=excluded.edit_note").bind(change.classId,change.categoryId,JSON.stringify(desired.get(id)||[]),email));
  }
  batch.push(env.DB.prepare("INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,note,source_table) VALUES(?,'admin','import_mp_tahap1',NULL,'matapelajaran',?,'actions')").bind(email,'90 nama, 18 kategori, 26 kelas; pertindihan '+overlaps.length));
  try{await env.DB.batch(batch)}catch{throw{status:409,message:'Import dibatalkan; tiada simpanan separa. Buat pratonton semula.'}}
  return respond({ok:true,saved:90,classes:26,changed:changes.length,overlaps:overlaps.length,published:false});
 }catch(e){return respond({error:e?.message||'Ralat import.'},Number.isInteger(e?.status)?e.status:500)}
}
