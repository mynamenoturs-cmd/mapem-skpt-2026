// Private, admin-only import of shortlisted UASA subject-award names.
// No student data is bundled with the website or committed to GitHub.
const HEAD={'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEAD});
const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
const idName=s=>norm(s).toLocaleLowerCase('ms');
const SUBJECT_IDS=['subjek-bm','subjek-bi','subjek-mt','subjek-sn','subjek-pai','subjek-pm'];
const SUBJECT_SET=new Set(SUBJECT_IDS);
const YEAR_SIZE={1:9,2:9,3:8};

async function administrator(request,env){
 const appOrigin=String(env.APP_ORIGIN||'').replace(/\/$/,'');
 if(!env.DB||!appOrigin)throw{status:503,message:'Cloudflare D1/APP_ORIGIN belum dikonfigurasi.'};
 if(request.headers.get('origin')!==appOrigin)throw{status:403,message:'Permintaan di luar portal tidak dibenarkan.'};
 const token=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-mapem_session='))?.slice('__Host-mapem_session='.length);
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw{status:401,message:'Sila log masuk sebagai pentadbir.'};
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),v=>v.toString(16).padStart(2,'0')).join('');
 const result=await env.DB.prepare('SELECT u.email FROM sessions s JOIN users u ON u.sub=s.user_sub WHERE s.id_hash=? AND s.expires_at>?').bind(hash,Math.floor(Date.now()/1000)).first();
 if(!result?.email)throw{status:401,message:'Sesi tamat. Sila log masuk semula.'};
 const email=String(result.email).trim().toLowerCase();
 const defaults=new Set(String(env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
 if(!defaults.has(email)&&!(await env.DB.prepare('SELECT email FROM admin_grants WHERE email=?').bind(email).first()))throw{status:403,message:'Hanya pentadbir boleh mengimport mata pelajaran terbaik.'};
 return email;
}
function validate(body,classes){
 if(body?.schemaVersion!==1||body?.awardGroup!=='subject-awards'||!Array.isArray(body.records)||body.records.length!==90)throw{status:400,message:'Fail import mesti mengandungi tepat 90 nama mata pelajaran (6 subjek x 3 tahun x 5).'};
 const validClasses=new Map(classes.map(x=>[x.id,x]));
 const sets=new Map(),unique=new Set(),records=new Map();
 for(const r of body.records){
  if(!r||!SUBJECT_SET.has(r.categoryId)||!validClasses.has(r.classId))throw{status:400,message:'Kategori atau kelas tidak sah.'};
  const name=norm(r.name);
  if(name.length<2||name.length>160||/[<>]/.test(name))throw{status:400,message:'Nama murid tidak sah.'};
  const year=validClasses.get(r.classId).year;
  const field=year+'|'+r.categoryId,ident=r.classId+'|'+idName(name);
  if(unique.has(ident))throw{status:400,message:'Murid yang sama dipilih lebih daripada satu mata pelajaran: '+r.classId+'.'};
  unique.add(ident);
  sets.set(field,(sets.get(field)||0)+1);
  const key=r.classId+'|'+r.categoryId;
  records.set(key,[...(records.get(key)||[]),name]);
 }
 for(const year of [1,2,3])for(const categoryId of SUBJECT_IDS){
  if(sets.get(year+'|'+categoryId)!==5)throw{status:400,message:'Setiap subjek mesti mempunyai 5 penerima untuk Tahun '+year+': '+categoryId};
 }
 return records;
}
function versions(data,classes){
 const prev=new Map(data.map(d=>[d.class_id+'|'+d.category_id,d]));
 return Object.fromEntries(classes.flatMap(c=>SUBJECT_IDS.map(cat=>[c.id+'|'+cat,prev.get(c.id+'|'+cat)?.version??0])));
}
function draftsKey(x){return x.class_id+'|'+x.category_id;}
export async function onRequestPost({request,env}){
 try{
  const actor=await administrator(request,env);
  if(!request.headers.get('content-type')?.includes('application/json'))throw{status:415,message:'Hantar format JSON sahaja.'};
  const text=await request.text();
  if(text.length>45000)throw{status:413,message:'Fail import terlalu besar.'};
  let input;try{input=JSON.parse(text)}catch{throw{status:400,message:'Fail JSON tidak sah.'}}
  if(!['preview','commit'].includes(input?.mode))throw{status:400,message:'Mod import tidak sah.'};
  const classes=(await env.DB.prepare('SELECT id,year,name FROM classes WHERE year BETWEEN 1 AND 3 ORDER BY year,name').all()).results||[];
  if(classes.length!==26||[1,2,3].some(y=>classes.filter(c=>c.year===y).length!==YEAR_SIZE[y]))throw{status:409,message:'Senarai kelas portal berubah: perlu 9/9/8 kelas Tahun 1/2/3.'};
  const desired=validate(input,classes);
  const all=(await env.DB.prepare("SELECT class_id,category_id,names_json,version FROM drafts WHERE substr(class_id,1,1) IN ('1','2','3')").all()).results||[];
  const existing=all.filter(x=>SUBJECT_SET.has(x.category_id));
  const ext=all.filter(x=>!SUBJECT_SET.has(x.category_id));
  const older=new Map(existing.map(x=>[draftsKey(x),x]));
  const expected=versions(existing,classes);
  const changed=[],newValues=[];
  for(const c of classes)for(const categoryId of SUBJECT_IDS){
   const k=c.id+'|'+categoryId,names=desired.get(k)||[];
   const before=JSON.parse(older.get(k)?.names_json||'[]');
   if(JSON.stringify(before)!==JSON.stringify(names)){changed.push(k);newValues.push({key:k,classId:c.id,categoryId,names});}
  }
  const pubs=(await env.DB.prepare('SELECT class_id FROM publications WHERE class_id IN (SELECT id FROM classes WHERE year BETWEEN 1 AND 3)').all()).results||[];
  const locked=pubs.map(x=>x.class_id);
  const uasaConflicts=[],otherConflicts=[];
  const external=new Map();
  for(const x of ext){
   let names=[];try{names=JSON.parse(x.names_json)}catch{continue}
   if(!Array.isArray(names))continue;
   for(const name of names){
    const key=x.class_id+'|'+idName(name);
    external.set(key,[...(external.get(key)||[]),x.category_id]);
   }
  }
  for(const r of input.records){
   const clashes=external.get(r.classId+'|'+idName(r.name))||[];
   for(const categoryId of clashes){
    const detail={classId:r.classId,categoryId,subjectId:r.categoryId,name:norm(r.name)};
    (categoryId==='uasa'?uasaConflicts:otherConflicts).push(detail);
   }
  }
  if(input.mode==='preview')return reply({ok:true,mode:'preview',selected:90,changed,locked,uasaConflicts,otherConflicts,expectedVersions:expected,classes:26});
  if(locked.length)throw{status:423,message:'Ada '+locked.length+' kelas diterbitkan. Tarik balik penerbitan kelas itu sebelum import; tiada data diubah.'};
  if(uasaConflicts.length)throw{status:409,message:'Ada '+uasaConflicts.length+' pertindihan dengan UASA 10 Terbaik yang tersimpan. Kemas kini UASA dalam portal dahulu.'};
  if(otherConflicts.length&&input.acknowledgeOtherAwards!==true)throw{status:409,message:'Ada pertindihan dengan anugerah lain. Semak dan sahkan sebelum import.'};
  if(input.confirm!==true||!input.expectedVersions||typeof input.expectedVersions!=='object'||Array.isArray(input.expectedVersions))throw{status:400,message:'Pratonton dan pengesahan diperlukan.'};
  const versionKeys=Object.keys(expected),clientKeys=Object.keys(input.expectedVersions);
  if(versionKeys.length!==clientKeys.length||versionKeys.some(k=>!Object.hasOwn(input.expectedVersions,k)||input.expectedVersions[k]!==expected[k]))throw{status:409,message:'Versi senarai telah berubah. Buat pratonton baharu.'};
  if(typeof env.DB.batch!=='function')throw{status:503,message:'D1 transaction batch tidak tersedia.'};
  if(!newValues.length)return reply({ok:true,mode:'commit',saved:90,changed:0,published:false,message:'Kesemua nama sudah sepadan dengan portal.'});
  // Guard all 156 category/class pairs to prevent a concurrent admin edit.
  // A failed guard aborts D1.batch's entire transaction.
  const batch=[];
  for(const c of classes)for(const categoryId of SUBJECT_IDS){
   const k=c.id+'|'+categoryId;
   batch.push(env.DB.prepare("SELECT CASE WHEN COALESCE((SELECT version FROM drafts WHERE class_id=? AND category_id=?),0)=? AND NOT EXISTS(SELECT 1 FROM publications WHERE class_id=?) THEN 1 ELSE json_extract('{','$') END AS ok").bind(c.id,categoryId,expected[k],c.id));
  }
  for(const x of newValues){
   batch.push(env.DB.prepare("INSERT INTO drafts(class_id,category_id,names_json,version,updated_at,updated_by,editor_role,edit_note) VALUES(?,?,?,1,datetime('now'),?,'admin','Import 5 terbaik mata pelajaran Tahap 1') ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=drafts.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by,editor_role=excluded.editor_role,edit_note=excluded.edit_note").bind(x.classId,x.categoryId,JSON.stringify(x.names),actor));
  }
  const changedClasses=[...new Set(newValues.map(x=>x.classId))];
  for(const classId of changedClasses)batch.push(env.DB.prepare("UPDATE classes SET updated_at=datetime('now') WHERE id=?").bind(classId));
  batch.push(env.DB.prepare("INSERT INTO activity_logs(actor_email,actor_role,action,class_id,category_id,note,source_table) VALUES(?,'admin','import_subjek_tahap1',NULL,'subjek-bm',?,'actions')").bind(actor,'90 pilihan 5 MP: BM/BI/MT/SN/PAI/PM Tahun 1–3'));
  try{await env.DB.batch(batch)}catch{throw{status:409,message:'Transaksi dibatalkan kerana perubahan serentak atau ralat D1. Tiada perubahan separa disimpan; buat pratonton semula.'}}
  return reply({ok:true,mode:'commit',saved:90,changed:newValues.length,published:false,otherAwardOverlapCount:otherConflicts.length,message:'90 nama mata pelajaran telah disimpan sebagai draf, bukan diterbitkan.'});
 }catch(e){return reply({error:e?.message||'Ralat import mata pelajaran.'},Number.isInteger(e?.status)?e.status:500)}
}
