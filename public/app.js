(()=>{
"use strict";
const app=document.getElementById("app"),toastBox=document.getElementById("toast");
const state={token:"",role:"",data:null,year:0,timers:{},pending:{},editing:{}};
const h=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const el=id=>document.getElementById(id);
function notify(s){toastBox.textContent=s;toastBox.classList.add("show");clearTimeout(notify.t);notify.t=setTimeout(()=>toastBox.classList.remove("show"),3800);}
function hero(title,text,label="MAJLIS APRESIASI PRESTASI MURID"){return '<div class="hero"><div><span class="eyebrow">'+h(label)+'</span><h1>'+h(title)+'</h1><p>'+h(text)+'</p><div class="chips"><span>TAHAP 1 · TAHUN 1–3</span><span>7 NOVEMBER 2026</span></div></div></div>';}
async function api(route,method="GET",data){let o={method,headers:{Authorization:"Bearer "+state.token}};if(data!==undefined){o.headers["Content-Type"]="application/json";o.body=JSON.stringify(data);}let r;try{r=await fetch("/api/"+route,o);}catch{throw Error("Tiada sambungan Internet. Cuba semula.");}if(!r.ok){let e=await r.json().catch(()=>({}));throw Error(e.error||"Ralat "+r.status);}return route==="admin/export"?r.blob():r.json();}
function loadError(message){app.innerHTML=hero("Akses tidak berjaya","Sila semak pautan kelas atau hubungi urus setia.")+'<section class="section"><div class="card"><h2>Tidak dapat membuka portal</h2><p>'+h(message)+'</p><button class="btn" id="retry">Cuba semula</button></div></section>';el("retry").onclick=()=>location.reload();}
function welcome(){
 app.innerHTML=hero("Setiap pencapaian, satu penghargaan.","Portal pengumpulan senarai nama penerima anugerah MaPeM SK Pekan Telipok. Satu pautan bagi satu kelas.")+
 '<section class="section login"><div class="card"><span class="eyebrow" style="color:#aa7a40">PANDUAN GURU KELAS</span><h2 style="margin-top:11px">Isi sekali, kemas kini dengan mudah.</h2><p>Semua kategori ada pada satu halaman. Anda tidak perlu memasukkan e-mel, jantina atau mengisi borang berulang kali.</p>'+
 [["01","Buka pautan kelas","Gunakan pautan kelas yang dikongsikan urus setia."],["02","Isikan senarai nama","Satu nama penuh murid pada setiap baris. Perubahan disimpan automatik."],["03","Hantar senarai akhir","Semak semua nama sebelum mengesahkan penghantaran."]].map(x=>'<div class="step"><b>'+x[0]+'</b><div><strong>'+x[1]+'</strong><p>'+x[2]+'</p></div></div>').join("")+'<div class="notice">Guru kelas: sila gunakan pautan khas kelas masing-masing daripada urus setia.</div></div>'+
 '<div class="card"><span class="eyebrow" style="color:#aa7a40">URUS SETIA</span><h2 style="margin-top:11px">Masuk Pentadbir</h2><p>Urus pautan 26 kelas, pantau kuota dan eksport senarai akhir.</p><form id="admin-form"><div class="field"><label for="key">Kunci pentadbir</label><input id="key" type="password" minlength="32" required placeholder="Masukkan ADMIN_KEY"></div><button class="btn block">Buka dashboard →</button></form><p class="muted">Rahsia pentadbir dikonfigurasi di Cloudflare. Jangan kongsi dengan guru kelas.</p></div></section>';
 el("admin-form").onsubmit=async ev=>{ev.preventDefault();let b=ev.currentTarget.querySelector("button");b.disabled=true;state.token=el("key").value.trim();try{let r=await api("auth");if(r.role!=="admin")throw Error("Kunci admin tidak sah.");state.role="admin";sessionStorage.setItem("mapem-admin",state.token);await admin();}catch(e){notify(e.message);b.disabled=false;}};
}
function statusTag(v){return '<span class="tag '+h(v)+'">'+(v==="submitted"?"✓ Dihantar":"● Draf")+"</span>";}
async function admin(){
 try{state.data=await api("admin/overview");}catch(e){return loadError(e.message);}
 state.role="admin";const d=state.data,classes=d.classes,shown=classes.filter(x=>!state.year||x.year===state.year);
 const count=classes.reduce((s,x)=>s+x.total,0);
 const quotas=d.categories.flatMap(c=>c.scope==="year"?Object.entries(c.quota).map(([y,q])=>({title:c.name+" · Tahun "+y,limit:q,count:d.totals[c.id]?.[y]||0})):c.scope==="total"?[{title:c.name,limit:c.quota,count:Object.values(d.totals[c.id]||{}).reduce((a,b)=>a+b,0)}]:[]);
 app.innerHTML=hero("Dashboard Urus Setia","Status pengumpulan penerima anugerah, pautan kelas, kuota dan eksport dalam satu halaman.","PENGURUSAN MAPEM 2026")+
 '<section class="section"><div class="grid metrics">'+[["Jumlah Kelas",26,"9 + 9 + 8 kelas"],["Telah Hantar",d.submitted,"Senarai akhir disahkan"],["Belum Hantar",26-d.submitted,"Masih memerlukan tindakan"],["Nama Direkod",count,"Semua kategori"]].map(x=>'<div class="metric"><label>'+x[0]+'</label><b>'+x[1]+'</b><small>'+x[2]+'</small></div>').join("")+'</div>'+
 '<div class="section-head"><div><h2>Senarai Kelas</h2><p>Edarkan pautan mengikut kelas sahaja. Pautan tidak meminta log masuk guru.</p></div><div class="tools"><button class="btn alt small" id="export">↓ Eksport CSV</button><button class="btn alt small" id="refresh">↻ Segar semula</button><button class="btn danger small" id="logout">Keluar</button></div></div><div class="layout"><div class="card">'+
 '<div class="filters" style="margin-bottom:14px">'+[0,1,2,3].map(n=>'<button class="btn small '+(n===state.year?"":"alt")+'" data-filter="'+n+'">'+(n?"Tahun "+n:"Semua")+'</button>').join("")+'</div>'+
 '<div class="scroll"><table><thead><tr><th>Kelas</th><th>Nama</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>'+shown.map(c=>'<tr><td><b>'+h(c.year+" "+c.name)+'</b></td><td>'+c.total+'</td><td>'+statusTag(c.status)+'</td><td><div class="buttons"><button class="btn small" data-copy="'+h(c.id)+'">Salin pautan</button><button class="btn alt small" data-status="'+h(c.id)+'">'+(c.status==="submitted"?"Buka":"Kunci")+'</button><button class="btn danger small" data-rotate="'+h(c.id)+'">Reset pautan</button></div></td></tr>').join("")+'</tbody></table></div></div>'+
 '<div class="card"><h3>Pemantauan Kuota Anugerah</h3><p>Kuota keseluruhan mengikut tahun atau Tahap 1; bukan kuota untuk setiap kelas.</p>'+
 quotas.map(q=>'<div class="quota"><div class="legend"><strong>'+h(q.title)+'</strong><span>'+q.count+" / "+q.limit+'</span></div><div class="bar-bg"><div class="bar '+(q.count>q.limit?"over":"")+'" style="width:'+Math.min(100,q.count/q.limit*100)+'%"></div></div></div>').join("")+'</div></div></section>';
 document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{state.year=Number(b.dataset.filter);admin();});
 document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{let c=d.classes.find(c=>c.id===b.dataset.copy);let url=location.origin+location.pathname+"?k="+encodeURIComponent(c.token);try{await navigator.clipboard.writeText(url);notify("Pautan "+c.year+" "+c.name+" disalin.");}catch{window.prompt("Salin pautan kelas:",url);}});
 document.querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{let c=d.classes.find(c=>c.id===b.dataset.status);let next=c.status==="submitted"?"draft":"submitted";if(!confirm((next==="draft"?"Buka semula":"Kunci")+" pengisian kelas "+c.year+" "+c.name+"?"))return;try{await api("admin/status","POST",{classId:c.id,status:next});await admin();notify("Status berjaya dikemas kini.");}catch(e){notify(e.message);}});
 document.querySelectorAll("[data-rotate]").forEach(b=>b.onclick=async()=>{let c=d.classes.find(c=>c.id===b.dataset.rotate);if(!confirm("Batalkan pautan lama kelas "+c.year+" "+c.name+"? Guru perlu menerima pautan baharu."))return;try{await api("admin/rotate","POST",{classId:c.id});await admin();notify("Pautan lama telah dibatalkan. Salin pautan baharu.");}catch(e){notify(e.message);}});
 el("refresh").onclick=()=>admin();
 el("logout").onclick=()=>{sessionStorage.removeItem("mapem-admin");state.token="";history.replaceState({},"",location.pathname);welcome();};
 el("export").onclick=async()=>{try{let b=await api("admin/export");let u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="MaPeM_SKPT_Penerima_2026.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}catch(e){notify(e.message);}};
}
function readNames(id){return (el("ta-"+id)?.value||"").split(/\r?\n/).map(n=>n.trim().replace(/\s+/g," ")).filter(Boolean);}
function editorStatus(id,msg,cls){let e=el("save-"+id);if(e){e.textContent=msg;e.className=cls||"";}}
async function persist(id){
 const inp=el("ta-"+id);if(!inp||inp.disabled)return;
 if(state.pending[id]){state.editing[id]=true;return;}
 clearTimeout(state.timers[id]);state.pending[id]=true;state.editing[id]=false;
 const record=state.data.drafts[id]||{names:[],version:0},names=readNames(id);
 if(JSON.stringify(names)===JSON.stringify(record.names)){state.pending[id]=false;editorStatus(id,"Disimpan","saved");return;}
 editorStatus(id,"Menyimpan...","saving");
 try{let res=await api("class/save","POST",{categoryId:id,names,version:record.version});state.data.drafts[id]={names,version:res.version};editorStatus(id,"✓ Disimpan automatik","saved");}
 catch(e){editorStatus(id,"Gagal simpan: "+e.message,"save-error");notify(e.message);}
 finally{state.pending[id]=false;if(state.editing[id])state.timers[id]=setTimeout(()=>persist(id),120);}
}
async function flushAll(){Object.keys(state.timers).forEach(k=>clearTimeout(state.timers[k]));for(const c of state.data.categories){let id=c.id;while(state.pending[id])await new Promise(r=>setTimeout(r,110));const r=state.data.drafts[id]||{names:[]};if(el("ta-"+id)&&JSON.stringify(readNames(id))!==JSON.stringify(r.names)){await persist(id);while(state.pending[id])await new Promise(r=>setTimeout(r,110));if(JSON.stringify(readNames(id))!==JSON.stringify(state.data.drafts[id]?.names||[]))throw Error("Sila pastikan semua senarai berjaya disimpan.");}}}
async function teacher(){
 try{state.data=await api("class");}catch(e){return loadError(e.message);}
 state.role="teacher";let d=state.data,c=d.class,locked=c.status==="submitted";state.pending={};state.timers={};state.editing={};
 let count=Object.values(d.drafts).reduce((s,r)=>s+r.names.length,0);
 app.innerHTML=hero("Selamat Datang, "+c.year+" "+c.name,"Lengkapkan senarai nama penerima anugerah mengikut kategori yang berkenaan. Satu nama penuh murid pada setiap baris.","PENGISIAN KHUSUS KELAS")+
 '<section class="section"><div class="grid metrics" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="metric"><label>Jumlah Nama Direkod</label><b>'+count+'</b><small>Semua kategori kelas anda</small></div><div class="metric"><label>Status Penghantaran</label><b style="font-size:20px;margin-top:11px">'+(locked?"Sudah dihantar":"Sedang diisi")+'</b><small>'+(locked?"Hubungi urus setia untuk pindaan":"Simpanan automatik diaktifkan")+'</small></div></div><div class="section-head"><div><h2>Kategori Anugerah</h2><p>Isi hanya kategori yang mempunyai penerima daripada kelas anda. Kuota ialah kuota keseluruhan, bukan kuota kelas.</p></div><span class="tag '+(locked?"submitted":"draft")+'">'+(locked?"Senarai dikunci":"Draf boleh diubah")+'</span></div><div class="teacher-layout"><aside class="card nav-box"><h3>Senarai Kategori</h3>'+d.categories.map((cat,i)=>'<a class="nav-item" href="#c-'+h(cat.id)+'">'+(i+1)+'. '+h(cat.name)+'</a>').join("")+'</aside><div>'+
 d.categories.map((cat,i)=>{let r=d.drafts[cat.id]||{names:[],version:0};let quota=cat.scope==="year"?"Kuota keseluruhan Tahun "+c.year+": "+(cat.quota?.[c.year]??"belum ditetapkan"):cat.scope==="total"?"Kuota keseluruhan Tahap 1: "+cat.quota:"Kuota belum ditetapkan";return '<details class="card category" id="c-'+h(cat.id)+'" '+(i===0?"open":"")+'><summary><div><h3>'+h(cat.name)+'</h3><small>'+h(quota)+'</small></div><span class="tag draft" id="n-'+h(cat.id)+'">'+r.names.length+' nama ▾</span></summary><div class="edit"><p>Satu nama penuh murid pada setiap baris. Anda boleh menambah atau memadam nama sebelum penghantaran akhir.</p><textarea id="ta-'+h(cat.id)+'" data-category="'+h(cat.id)+'" '+(locked?"disabled":"")+' placeholder="Contoh:\nMuhammad Adam bin Ali\nNur Aisyah binti Ahmad">'+h(r.names.join("\n"))+'</textarea><div class="edit-bottom"><span id="save-'+h(cat.id)+'">'+(locked?"Senarai dikunci":"Simpanan automatik")+'</span><button class="btn alt small" data-save="'+h(cat.id)+'" '+(locked?"disabled":"")+'>Simpan sekarang</button></div></div></details>';}).join("")+
 '<div class="finalize"><div><h3>Semakan & Penghantaran Akhir</h3><p>'+ (locked?"Penghantaran sudah disahkan dan dikunci.":"Pastikan semua nama betul. Selepas dihantar, hanya urus setia boleh membuka semula.")+'</p></div><button id="submit" class="btn" '+(locked?"disabled":"")+'> '+(locked?"✓ Sudah dihantar":"Hantar Senarai Akhir →")+'</button></div></div></div></section>';
 document.querySelectorAll("textarea[data-category]").forEach(t=>t.oninput=()=>{let id=t.dataset.category;let n=el("n-"+id);if(n)n.textContent=readNames(id).length+" nama ▾";editorStatus(id,"Menunggu simpan...","saving");clearTimeout(state.timers[id]);state.timers[id]=setTimeout(()=>persist(id),850);});
 document.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>persist(b.dataset.save));
 if(!locked)el("submit").onclick=async()=>{if(!confirm("Hantar senarai akhir untuk kelas "+c.year+" "+c.name+"? Pengisian akan dikunci."))return;let b=el("submit");b.disabled=true;try{await flushAll();await api("class/submit","POST",{});notify("Senarai akhir berjaya dihantar.");await teacher();}catch(e){notify(e.message);b.disabled=false;}};
}
async function boot(){
 let tok=new URL(location.href).searchParams.get("k")||sessionStorage.getItem("mapem-admin");
 if(!tok)return welcome();
 state.token=tok;try{let user=await api("auth");state.role=user.role;if(user.role==="admin"){if(new URL(location.href).searchParams.has("k")){sessionStorage.setItem("mapem-admin",tok);history.replaceState({},"",location.pathname);}await admin();}else await teacher();}catch(e){loadError(e.message);}
}
boot();
})();