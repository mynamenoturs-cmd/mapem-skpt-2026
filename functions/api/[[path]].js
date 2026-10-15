const CATEGORIES=[
{id:"pbd",code:"PBD",name:"Anugerah Pencapaian PBD Terbaik",scope:"year",quota:{1:45,2:45,3:40},teacher:true},
{id:"uasa",code:"UASA",name:"Anugerah 10 Pencapaian Terbaik (UASA)",scope:"year",quota:{1:10,2:10,3:10},teacher:true},
{id:"matapelajaran",code:"MP",name:"Anugerah Pencapaian Mata Pelajaran Terbaik",scope:"year",quota:{1:30,2:30,3:30},teacher:true},
{id:"plan",code:"PLAN",name:"Anugerah Khas PLAN",scope:"year",quota:{1:null,2:null,3:null},teacher:true},
{id:"cemara",code:"CEMARA",name:"Anugerah Ikon Cemara Tahap 1 (L/P)",scope:"total",quota:2,teacher:false,manualGenderCheck:true},
{id:"kurikulum",code:"KURIKULUM",name:"Anugerah Khas Kurikulum Tahap 1 (L/P)",scope:"total",quota:2,teacher:false,manualGenderCheck:true},
{id:"kokurikulum",code:"KOKU",name:"Harapan Kokurikulum Tahap 1 (L/P)",scope:"total",quota:2,teacher:false,manualGenderCheck:true},
{id:"hem",code:"HEM",name:"Harapan HEM (L/P)",scope:"total",quota:2,teacher:false,manualGenderCheck:true},
{id:"ains",code:"AINS_HAMPER",name:"AINS NILAM - Hamper Individu",scope:"year",quota:{1:18,2:18,3:16},teacher:true},
{id:"ains-tokoh",code:"AINS_TOKOH",name:"AINS NILAM - Tokoh Tahap 1 (Piala)",scope:"total",quota:3,teacher:false},
{id:"delima",code:"DELIMA",name:"Ikon Navigator DELIMa",scope:"year",quota:{1:null,2:null,3:null},teacher:true},
{id:"mawar",code:"MAWAR",name:"Anugerah Tokoh Murid Mawar (L/P)",scope:"year",quota:{3:2},years:[3],teacher:false,manualGenderCheck:true}
];
const H={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex,nofollow"};
function j(v,s=200){return new Response(JSON.stringify(v),{status:s,headers:H});}
function bad(msg,status=400){return j({error:msg},status);}
function auth(req){return (req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();}
function constant(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function hex(b){return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,"0")).join("");}
async function sign(secret,message){let k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(message)));}
function key(env){return typeof env.ADMIN_KEY==="string"&&env.ADMIN_KEY.length>=32?env.ADMIN_KEY:null;}
function admin(req,env){return !!(key(env)&&constant(auth(req),key(env)));}
async function classToken(env,row){return ["c",row.id,row.token_version,await sign(key(env),"mapem-class:"+row.id+":"+row.token_version)].join(".");}
async function teacher(req,env){
 let p=auth(req).split(".");
 if(p.length!==4||p[0]!=="c"||!/^[123]-[a-z]+$/.test(p[1])||!/^\d+$/.test(p[2])||!/^[a-f0-9]{64}$/.test(p[3]))return null;
 const cls=await env.DB.prepare("SELECT id,year,name,status,token_version,updated_at,submitted_at FROM classes WHERE id=?").bind(p[1]).first();
 if(!cls||cls.token_version!==Number(p[2]))return null;
 return constant(p[3],await sign(key(env),"mapem-class:"+cls.id+":"+cls.token_version))?cls:null;
}
function namesValid(v){
 if(!Array.isArray(v)||v.length>100)throw Error("Maksimum 100 nama bagi satu kategori.");
 let n=v.map(x=>String(x).trim().replace(/\s+/g," ")).filter(Boolean);
 if(n.some(x=>x.length<2||x.length>160))throw Error("Setiap nama mestilah 2 hingga 160 aksara.");
 if(new Set(n.map(x=>x.toLocaleLowerCase("ms"))).size!==n.length)throw Error("Nama berulang dikesan dalam kategori sama.");
 return n;
}
function quote(v){return '"'+String(v??"").replace(/^[=+\-@\t\r]/,"'$&").replace(/"/g,'""')+'"';}
async function body(req){if(Number(req.headers.get("content-length")||0)>80000)throw Error("Data terlalu besar.");return req.json();}
export async function onRequest({request:req,env}){
 if(req.method==="OPTIONS")return new Response(null,{status:405,headers:H});
 if(!env.DB)return bad("Database D1 belum dipautkan kepada binding DB.",503);
 if(!key(env))return bad("ADMIN_KEY belum ditetapkan (minimum 32 aksara).",503);
 const path=new URL(req.url).pathname.replace(/^\/api\/?/,"").replace(/\/$/,"");
 try{
 if(path==="health"&&req.method==="GET")return j({ok:true,app:"MaPeM SKPT 2026"});
 if(path==="auth"&&req.method==="GET"){
  if(admin(req,env))return j({role:"admin"});
  let cls=await teacher(req,env);return cls?j({role:"teacher",class:cls}):bad("Pautan tidak sah atau telah dibatalkan.",401);
 }
 if(path==="class"&&req.method==="GET"){
  let cls=await teacher(req,env);if(!cls)return bad("Pautan kelas tidak sah.",401);
  let data=await env.DB.prepare("SELECT category_id,names_json,version FROM drafts WHERE class_id=?").bind(cls.id).all();
  return j({class:cls,categories:CATEGORIES.filter(c=>c.teacher!==false&&(!c.years||c.years.includes(cls.year))),drafts:Object.fromEntries((data.results||[]).map(d=>[d.category_id,{names:JSON.parse(d.names_json),version:d.version}]))});
 }
 if(path==="class/save"&&req.method==="POST"){
  let cls=await teacher(req,env);if(!cls)return bad("Pautan kelas tidak sah.",401);
  if(cls.status==="submitted")return bad("Senarai telah dihantar. Hubungi urus setia untuk pembetulan.",423);
  let b=await body(req),category=CATEGORIES.find(c=>c.id===b.categoryId&&c.teacher!==false&&(!c.years||c.years.includes(cls.year)));
  if(!category)return bad("Kategori tidak sah.");
  let v=Number(b.version),list=namesValid(b.names);
  if(!Number.isSafeInteger(v)||v<0)return bad("Versi simpanan tidak sah.");
  let result=await env.DB.prepare("INSERT INTO drafts(class_id,category_id,names_json,version,updated_at) SELECT ?,?,?,1,datetime('now') WHERE ?=0 ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=drafts.version+1,updated_at=datetime('now') WHERE drafts.version=?").bind(cls.id,category.id,JSON.stringify(list),v,v).run();
  if(!result.meta?.changes)return bad("Suntingan bertembung. Muat semula halaman dan cuba lagi.",409);
  await env.DB.prepare("UPDATE classes SET updated_at=datetime('now') WHERE id=?").bind(cls.id).run();
  return j({ok:true,version:v+1,total:list.length});
 }
 if(path==="class/submit"&&req.method==="POST"){
  let cls=await teacher(req,env);if(!cls)return bad("Pautan kelas tidak sah.",401);
  let d=await env.DB.prepare("SELECT names_json FROM drafts WHERE class_id=?").bind(cls.id).all();
  if(!(d.results||[]).some(x=>JSON.parse(x.names_json).length))return bad("Sila isi sekurang-kurangnya satu nama.");
  let r=await env.DB.prepare("UPDATE classes SET status='submitted',submitted_at=datetime('now'),updated_at=datetime('now') WHERE id=? AND status='draft'").bind(cls.id).run();
  return r.meta?.changes?j({ok:true}):bad("Senarai sudah dihantar.",409);
 }
 if(path.startsWith("admin/")){
  if(!admin(req,env))return bad("Akses urus setia tidak sah.",401);
  if(path==="admin/overview"&&req.method==="GET"){
   let [c,d]=await Promise.all([env.DB.prepare("SELECT id,year,name,status,token_version,updated_at,submitted_at FROM classes ORDER BY year,name").all(),env.DB.prepare("SELECT class_id,category_id,names_json FROM drafts").all()]);
   let sums=new Map(),totals={};
   for(let a of d.results||[]){let n=JSON.parse(a.names_json).length,y=Number(a.class_id[0]);sums.set(a.class_id,(sums.get(a.class_id)||0)+n);(totals[a.category_id]??={})[y]=((totals[a.category_id]||{})[y]||0)+n;}
   let classes=await Promise.all((c.results||[]).map(async cls=>({...cls,total:sums.get(cls.id)||0,token:await classToken(env,cls)})));
   return j({classes,categories:CATEGORIES,totals,submitted:classes.filter(c=>c.status==="submitted").length});
  }
  if(path==="admin/special"&&req.method==="GET"){
   const id=new URL(req.url).searchParams.get("classId")||"";
   const cls=await env.DB.prepare("SELECT id,year,name,status FROM classes WHERE id=?").bind(id).first();
   if(!cls)return bad("Kelas tidak ditemui.",404);
   const records=await env.DB.prepare("SELECT category_id,names_json,version FROM drafts WHERE class_id=?").bind(cls.id).all();
   return j({class:cls,categories:CATEGORIES.filter(c=>c.teacher===false&&(!c.years||c.years.includes(cls.year))),drafts:Object.fromEntries((records.results||[]).filter(d=>CATEGORIES.some(c=>c.id===d.category_id&&c.teacher===false)).map(d=>[d.category_id,{names:JSON.parse(d.names_json),version:d.version}]))});
  }
  if(path==="admin/special/save"&&req.method==="POST"){
   const b=await body(req);
   const cls=await env.DB.prepare("SELECT id,year FROM classes WHERE id=?").bind(String(b.classId||"")).first();
   if(!cls)return bad("Kelas tidak ditemui.",404);
   const category=CATEGORIES.find(c=>c.id===b.categoryId&&c.teacher===false&&(!c.years||c.years.includes(cls.year)));
   if(!category)return bad("Kategori anugerah khas tidak sah.");
   const version=Number(b.version),list=namesValid(b.names);
   if(!Number.isSafeInteger(version)||version<0)return bad("Versi simpanan tidak sah.");
   const saved=await env.DB.prepare("INSERT INTO drafts(class_id,category_id,names_json,version,updated_at) SELECT ?,?,?,1,datetime('now') WHERE ?=0 ON CONFLICT(class_id,category_id) DO UPDATE SET names_json=excluded.names_json,version=drafts.version+1,updated_at=datetime('now') WHERE drafts.version=?").bind(cls.id,category.id,JSON.stringify(list),version,version).run();
   if(!saved.meta?.changes)return bad("Suntingan bertembung. Muat semula senarai dan cuba lagi.",409);
   await env.DB.prepare("UPDATE classes SET updated_at=datetime('now') WHERE id=?").bind(cls.id).run();
   return j({ok:true,version:version+1,total:list.length});
  }
  if(path==="admin/status"&&req.method==="POST"){
   let b=await body(req);if(!["draft","submitted"].includes(b.status))return bad("Status tidak sah.");
   let r=await env.DB.prepare("UPDATE classes SET status=?,submitted_at=CASE WHEN ?='submitted' THEN datetime('now') ELSE NULL END,updated_at=datetime('now') WHERE id=?").bind(b.status,b.status,String(b.classId)).run();
   return r.meta?.changes?j({ok:true}):bad("Kelas tidak ditemui.",404);
  }
  if(path==="admin/rotate"&&req.method==="POST"){
   let b=await body(req);
   let r=await env.DB.prepare("UPDATE classes SET token_version=token_version+1 WHERE id=?").bind(String(b.classId)).run();
   return r.meta?.changes?j({ok:true}):bad("Kelas tidak ditemui.",404);
  }
  if(path==="admin/export"&&req.method==="GET"){
   let [a,b]=await Promise.all([env.DB.prepare("SELECT id,year,name,status FROM classes").all(),env.DB.prepare("SELECT class_id,category_id,names_json FROM drafts").all()]);
   let lookup=new Map((a.results||[]).map(x=>[x.id,x])),category=new Map(CATEGORIES.map(x=>[x.id,x.name]));
   let rows=[["Tahun","Kelas","Kategori","Bil","Nama Penuh Murid","Status"]];
   for(let row of b.results||[]){let cls=lookup.get(row.class_id);if(cls)JSON.parse(row.names_json).forEach((n,i)=>rows.push([cls.year,cls.year+" "+cls.name,category.get(row.category_id)||row.category_id,i+1,n,cls.status]));}
   return new Response("\uFEFF"+rows.map(x=>x.map(quote).join(",")).join("\r\n"),{headers:{"content-type":"text/csv;charset=utf-8","content-disposition":"attachment; filename=mapem-penerima-2026.csv","cache-control":"no-store"}});
  }
 }
 return bad("API tidak ditemui.",404);
 }catch(ex){let m=String(ex.message||"Ralat pelayan");if(/no such table|D1_ERROR/i.test(m))return bad("Jalankan migrasi SQL pada Cloudflare D1 dahulu.",503);if(/Maksimum|Setiap nama|Nama berulang|Data terlalu besar|JSON/.test(m))return bad(m,400);console.error(ex);return bad("Ralat pelayan. Cuba lagi sebentar.",500);}
}
