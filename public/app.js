(()=>{'use strict';
const root=document.querySelector('#root'),toast=document.querySelector('#toast'),chip=document.querySelector('#role-chip'),logoutBtn=document.querySelector('#logout'),installBtn=document.querySelector('#install'),viewBtn=document.querySelector('#view');
const state={me:null,mode:'admin',tab:'classes',year:0,tahap:1,viewerTahap:1,overview:null,selectedClass:'',workCategory:'',workClass:'',workDirty:false,eventDirty:false,activeSpecial:'',classDetails:null,timers:{},saving:{},pendingEdit:{},drafts:null,teacherData:null,installEvent:null,conflicts:{},taskFeedback:null,teacherFeedback:null};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const msg=s=>{const dialog=document.querySelector('dialog[open]');if(dialog){let notice=dialog.querySelector('.dialog-message');if(!notice){notice=document.createElement('div');notice.className='notice warning dialog-message';notice.setAttribute('role','status');dialog.querySelector('.dialog-body').prepend(notice);}notice.textContent=s;}toast.textContent=s;toast.classList.add('show');clearTimeout(msg.timer);msg.timer=setTimeout(()=>toast.classList.remove('show'),4500);};
async function api(path,method='GET',body){const opt={method,credentials:'same-origin',headers:{Accept:'application/json'}};if(body!==undefined){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body);}let response;try{response=await fetch('/api/'+path,opt);}catch{throw Error('Sambungan terputus. Sila semak Internet.');}if(!response.ok){const r=await response.json().catch(()=>({}));const err=new Error(r.error||'Ralat '+response.status);err.status=response.status;throw err;}return path.startsWith('admin/export')&&!path.includes('format=json')?response.blob():response.json();}
function hero(title,description,kicker='MAJLIS APRESIASI PRESTASI MURID'){return `<section class="hero" aria-label="Banner rasmi MaPeM SKPT 2026"><span class="hero-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div class="hero-copy"><span class="eyebrow"><span class="eyebrow-dot"></span>${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p><span class="sub"><span aria-hidden="true">✦</span> MaPeM SKPT 2026 · Tahap 1 &amp; 2 · Tahun 1–5</span></div></section>`;}

const icons={home:'◈',classes:'▦',teachers:'♙',admins:'♜',announcement:'◉',event:'◷',tasks:'♙',work:'✧',special:'✧',quotas:'◷',titles:'✎',awards:'♜',submit:'✓',published:'☷',audit:'◴'};
function mount(content,active='home'){
 const me=state.me;setNav();document.body.classList.toggle('app-mode',!!me);
 if(!me){root.innerHTML=content;return;}
 const adminMode=me.role==='admin'&&state.mode==='admin',classMode=me.role==='teacher'||(me.role==='admin'&&state.mode==='class');
 const items=adminMode?[['classes','Pengurusan kelas'],['teachers','Akses guru'],['admins','Urus admin'],['announcement','Pengumuman portal'],['event','Maklumat majlis'],['tasks','Tugasan kategori'],['special','Pemilihan & pengisian'],['titles','Nama anugerah'],['quotas','Pemantauan kuota'],['audit','Log aktiviti']]:classMode?[['home','Ringkasan kelas'],['awards','Kategori anugerah'],['submit','Semakan akhir'],...(me.categoryIds?.length?[['work','Tugasan kategori']]:[])]:(me.role==='specialist'||(me.role==='admin'&&state.mode==='work'))?[['work','Tugasan kategori']]:[];
 root.innerHTML=`<button class="drawer-shade" id="drawer-shade" aria-label="Tutup menu" hidden></button><aside class="sidebar" id="app-sidebar" aria-label="Menu utama"><div class="sidebar-heading"><span>RUANG KERJA</span><button class="sidebar-close" id="sidebar-close" aria-label="Tutup menu">×</button></div>${me.role==='admin'&&(me.classId||me.categoryIds?.length)?`<div class="role-switch" aria-label="Tukar ruang kerja"><span>RUANG SAYA</span><button data-mode="admin" class="${state.mode==='admin'?'active':''}">♜ Mod Admin</button>${me.classId?`<button data-mode="class" class="${state.mode==='class'?'active':''}">▦ Kelas Saya <small>${esc(me.className)}</small></button>`:''}${me.categoryIds?.length?`<button data-mode="work" class="${state.mode==='work'?'active':''}">✧ Tugasan Saya <small>${me.categoryIds.length} kategori</small></button>`:''}</div>`:''}<nav>${items.map(([id,label])=>`<button class="side-link ${active===id?'active':''}" data-nav="${id}" ${active===id?'aria-current="page"':''}><span aria-hidden="true">${icons[id]}</span>${label}</button>`).join('')}<button class="side-link ${active==='published'?'active':''}" data-nav="published"><span aria-hidden="true">☷</span>Hab Guru &amp; Ibu Bapa</button></nav><div class="sidebar-bottom"><div class="workspace-identity"><span class="avatar" aria-hidden="true">${esc((me.name||'M')[0])}</span><div><strong>${esc(me.name||'Pengguna MaPeM')}</strong><small>${esc(me.role==='admin'?(state.mode==='class'?'Guru kelas · '+me.className:state.mode==='work'?'Guru tugasan kategori':'Urus setia'):me.role==='teacher'?me.className:me.role==='specialist'?'Guru tugasan kategori':'Paparan sahaja')}</small></div></div><button class="side-link" id="sidebar-logout"><span aria-hidden="true">↪</span>Log keluar</button><p>Melakar Prestasi,<br>Menjulang Tradisi.</p></div></aside><div class="workspace-scroll" id="workspace-scroll"><div class="workspace-content">${content}</div></div>`;
 $('sidebar-logout').onclick=()=>logoutBtn.click();$('sidebar-close').onclick=closeDrawer;$('drawer-shade').onclick=closeDrawer;
 const prepareNavigation=async()=>{if(!guardWorkChange())return false;if($('award-section')&&state.teacherData?.class.status==='draft')await finishSave();return true;};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=async()=>{closeDrawer();try{if(!await prepareNavigation())return;if(b.dataset.mode==='class')return await showTeacher();if(b.dataset.mode==='work')return await showWork();return await showAdmin();}catch(e){msg(e.message);}});
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=async()=>{closeDrawer();try{if(!await prepareNavigation())return;const nav=b.dataset.nav;if(nav==='published')return await showViewer();if(nav==='work')return await showWork();if(adminMode){state.tab=nav;return await showAdmin();}if(active==='published'||active==='work')await showTeacher();document.querySelectorAll('[data-nav]').forEach(n=>{n.classList.toggle('active',n.dataset.nav===nav);n.removeAttribute('aria-current');});document.querySelector(`[data-nav="${nav}"]`)?.setAttribute('aria-current','page');if(nav==='submit')openReview();else if(nav==='awards')$('award-section')?.scrollIntoView({behavior:'smooth',block:'start'});else $('workspace-scroll').scrollTo({top:0,behavior:'smooth'});}catch(e){msg(e.message);}});
}
const menuBtn=document.querySelector('#menu-toggle')||(()=>{const b=document.createElement('button');b.id='menu-toggle';b.className='icon-btn menu-toggle';b.hidden=true;b.textContent='☰';b.setAttribute('aria-label','Buka menu');b.setAttribute('aria-controls','app-sidebar');b.setAttribute('aria-expanded','false');document.querySelector('header .nav')?.prepend(b);return b;})();
function closeDrawer(){if($('workspace-scroll'))$('workspace-scroll').inert=false;document.body.classList.remove('drawer-open');menuBtn.setAttribute('aria-expanded','false');if($('drawer-shade'))$('drawer-shade').hidden=true;document.querySelector('#app-sidebar')?.removeAttribute('data-open');}
menuBtn.onclick=()=>{const open=!document.body.classList.contains('drawer-open');document.body.classList.toggle('drawer-open',open);menuBtn.setAttribute('aria-expanded',String(open));if($('drawer-shade'))$('drawer-shade').hidden=!open;if($('workspace-scroll'))$('workspace-scroll').inert=open;if(open)$('sidebar-close')?.focus();};
document.addEventListener('keydown',e=>{if(e.key==='Tab'&&document.body.classList.contains('drawer-open')){const nodes=[...$('app-sidebar').querySelectorAll('button')].filter(b=>b.offsetParent!==null);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}if(e.key==='Escape'&&document.body.classList.contains('drawer-open')){closeDrawer();menuBtn.focus();}});
function updateTeacherSummary(){const data=state.teacherData;if(!data)return;let total=0,filled=0;for(const cat of data.categories){const n=textareaList(cat.id).length;total+=n;if(n)filled++;const count=$('count-'+cat.id);if(count)count.textContent=n+' nama';}if($('teacher-total'))$('teacher-total').textContent=total;if($('teacher-progress'))$('teacher-progress').textContent=filled+' / '+data.categories.length;if($('teacher-bar'))$('teacher-bar').style.width=(100*filled/(data.categories.length||1))+'%';}
async function closeEditor(dialog,id){const button=dialog.querySelector('[data-close-editor]');button.disabled=true;try{if(state.teacherData.class.status==='draft'){clearTimeout(state.timers[id]);while(state.saving[id])await new Promise(r=>setTimeout(r,120));await saveTeacher(id);while(state.saving[id])await new Promise(r=>setTimeout(r,120));if(JSON.stringify(textareaList(id))!==JSON.stringify(state.teacherData.drafts[id]?.names||[]))throw Error(($('save-'+id)?.textContent||'Simpanan belum berjaya. Cuba simpan semula sebelum menutup.').replace(/^Gagal: /,''));}dialog.close();updateTeacherSummary();}catch(e){msg(e.message);}finally{button.disabled=false;}}
function openReview(){const data=state.teacherData;if(!data)return;let dialog=$('review-dialog');if(dialog)dialog.remove();dialog=document.createElement('dialog');dialog.id='review-dialog';dialog.className='app-dialog';const locked=data.class.status==='submitted';dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">SEMAKAN AKHIR</span><h2>Senarai kelas ${esc(data.class.year+' '+data.class.name)}</h2></div><button class="icon-btn" id="review-close" aria-label="Tutup semakan">×</button></div><div class="dialog-body"><p class="muted">Semak semua kategori sebelum menghantar. ${data.class.year===3?'Empat kategori khas ialah pencalonan Tahun 3 sahaja dan tidak diterbitkan secara automatik.':'Tahun 1 dan 2 hanya mengisi PBD.'} PBD mesti mempunyai tepat 5 nama.</p>${data.categories.map(c=>{const names=textareaList(c.id);return `<div class="review-category"><h3>${esc(c.nomination?'Pencalonan: '+c.name:c.name)} <span class="status draft">${names.length} nama</span></h3>${names.length?`<ol class="name-list">${names.map(n=>`<li>${esc(n)}</li>`).join('')}</ol>`:'<p class="muted">Belum diisi</p>'}</div>`;}).join('')}<div class="notice">${locked?'Senarai sudah dihantar. Hubungi urus setia untuk membuka semula.':'Selepas dihantar, pengisian dikunci sehingga dibuka semula oleh urus setia.'}</div></div><div class="dialog-actions"><button class="btn btn-outline" id="review-back">Kembali semak</button><button class="btn btn-green" id="confirm-submit" ${locked?'disabled':''}>${locked?'Telah dihantar':'Sahkan & hantar'}</button></div>`;document.body.append(dialog);const close=()=>{dialog.close();dialog.remove();};$('review-close').onclick=close;$('review-back').onclick=close;dialog.addEventListener('close',()=>dialog.remove(),{once:true});$('confirm-submit').onclick=async()=>{const btn=$('confirm-submit');btn.disabled=true;btn.textContent='Menyimpan & menghantar...';try{await finishSave();await api('teacher/submit','POST',{});close();msg('Senarai akhir berjaya dihantar.');await showTeacher();}catch(e){msg(e.message);btn.disabled=false;btn.textContent='Cuba hantar semula';}};dialog.showModal();}
window.addEventListener('beforeunload',e=>{if(state.teacherData?.class.status!=='draft'||!$('award-section'))return;const dirty=state.teacherData.categories.some(c=>state.saving[c.id]||JSON.stringify(textareaList(c.id))!==JSON.stringify(state.teacherData.drafts[c.id]?.names||[]));if(dirty){e.preventDefault();e.returnValue='';}});

function errorPage(message){mount(hero('Sistem belum tersedia','Sila semak konfigurasi atau cuba lagi sebentar.')+`<section class="card"><h2>Semakan diperlukan</h2><p>${esc(message)}</p><button class="btn" id="refresh-app">Cuba semula</button></section>`);$('refresh-app').onclick=()=>location.reload();}
function signedOut(){const bad=new URL(location.href).searchParams.get('login');mount(hero('Mengiktiraf kejayaan, menyemai inspirasi.','Portal rasmi pengurusan dan semakan senarai penerima anugerah MaPeM SK Pekan Telipok 2026.')+`<div id="login-announcement" hidden></div><section class="columns section"><article class="card"><span class="eyebrow" style="color:var(--gold)">SATU APLIKASI · TIGA AKSES</span><h2 style="margin-top:12px">Lebih mudah untuk semua</h2><div class="steps"><div class="step"><b>01</b><div><strong>Urus Setia / Pentadbir</strong><p>Urus guru kelas dan guru kategori, semak pencalonan, terbitkan senarai dan eksport laporan.</p></div></div><div class="step"><b>02</b><div><strong>Guru Kelas</strong><p>Tahun 1 dan 2: PBD sahaja. Tahun 3: PBD dan 4 pencalonan. Guru kategori mengisi anugerah yang ditugaskan sahaja.</p></div></div><div class="step"><b>03</b><div><strong>Guru Lain &amp; Ibu Bapa</strong><p>Semak penerima anugerah yang sudah disahkan dan diterbitkan urus setia.</p></div></div></div><div class="notice">Maklumat murid tidak akan dipaparkan kepada pengguna paparan sebelum diluluskan oleh urus setia.</div></article><article class="card"><span class="eyebrow" style="color:var(--gold)">LOG MASUK SELAMAT</span><h2 style="margin-top:12px">Selamat datang ke MaPeM</h2><p>Gunakan akaun Gmail atau Google Workspace anda. Fungsi akan dipaparkan secara automatik mengikut akses yang diberikan.</p>${bad?'<div class="notice warning">Log masuk tidak berjaya atau sesi tamat. Cuba lagi.</div>':''}<a class="btn btn-full" style="display:block;text-align:center;text-decoration:none;margin-top:22px" href="/api/auth/google/start">Teruskan dengan Google →</a><p class="hint">Dengan log masuk, anda hanya dapat melihat maklumat yang dibenarkan oleh pihak sekolah.</p><div class="notice" style="margin-top:28px">Android: buka Chrome → <strong>Pasang aplikasi</strong>. iPhone/iPad: buka Safari → Kongsi → <strong>Tambah ke Skrin Utama</strong>.</div></article></section>`);loadLoginAnnouncement();}
function setNav(){menuBtn.hidden=!state.me;if(!state.me){chip.hidden=true;logoutBtn.hidden=true;viewBtn.hidden=true;return;}chip.hidden=false;viewBtn.hidden=state.me.role==='viewer';chip.textContent=state.me.role==='admin'?(state.mode==='class'?'Guru · '+state.me.className:state.mode==='work'?'Tugasan saya':'Pentadbir'):state.me.role==='teacher'?'Guru · '+state.me.className:state.me.role==='specialist'?'Guru tugasan':'Guru / Ibu bapa';logoutBtn.hidden=false;}
viewBtn.onclick=async()=>{try{if(!guardWorkChange())return;if($('award-section')&&state.teacherData?.class.status==='draft')await finishSave();await showViewer();}catch(e){msg(e.message);}};
logoutBtn.onclick=async()=>{try{if(!guardWorkChange())return;if($('award-section')&&state.teacherData?.class.status==='draft')await finishSave();await api('logout','POST',{});location.href='/';}catch(e){msg(e.message);}};
async function boot(){try{const me=await api('me');state.me=me.authenticated?me.user:null;setNav();if(!state.me){signedOut();return;}if(state.me.role==='admin')await showAdmin();else if(state.me.role==='teacher')await showTeacher();else if(state.me.role==='specialist')await showWork();else await showViewer();}catch(e){errorPage(e.message);}}
// READ-ONLY: only a published snapshot reaches this view.
async function showViewer(){
 let payload;try{payload=await api('published');}catch(e){errorPage(e.message);return;}
 const extra=await Promise.allSettled([api('portal/event'),api('portal/announcements')]),event=extra[0].status==='fulfilled'?extra[0].value.event:null,announcements=extra[1].status==='fulfilled'?extra[1].value.announcements:[];
 const cats=new Map(payload.categories.map(c=>[c.id,c.name])),students=[];
 for(const cls of payload.classes){const people=new Map();for(const [id,names] of Object.entries(cls.awards))for(const name of names){const key=name.trim().toLocaleLowerCase('ms');if(!people.has(key))people.set(key,{name,classId:cls.classId,label:cls.year+' '+cls.className,year:cls.year,publishedAt:cls.publishedAt,awards:[]});people.get(key).awards.push({id,title:cats.get(id)||id});}students.push(...people.values());}
 students.sort((a,b)=>a.name.localeCompare(b.name,'ms'));let visible=[],page=1;
 mount(`<section class="hub-welcome"><div><span class="eyebrow">BERSAMA MERAIKAN KEJAYAAN</span><h1>Hab Guru &amp; Ibu Bapa</h1><p>Semak penerima, rancang kehadiran dan ikuti makluman MaPeM.</p></div><img src="/icon-192.png?v=7" alt="" aria-hidden="true"></section><div class="hub-tabs" role="tablist" aria-label="Bahagian hab"><button id="hub-tab-results" role="tab" aria-selected="true" aria-controls="hub-results" tabindex="0">♜ Penerima</button><button id="hub-tab-event" role="tab" aria-selected="false" aria-controls="hub-event" tabindex="-1">◷ Info majlis</button><button id="hub-tab-news" role="tab" aria-selected="false" aria-controls="hub-news" tabindex="-1">◉ Makluman${announcements.length?' <span class="news-dot" aria-label="Ada pengumuman"></span>':''}${announcements.length?' ('+announcements.length+')':''}</button></div><section id="hub-results" role="tabpanel" aria-labelledby="hub-tab-results"><div class="hub-summary"><div><b id="hub-stage-recipients">${students.filter(p=>tahunDalamTahap(p.year,state.viewerTahap)).length}</b><span>Penerima Tahap <span id="hub-stage-name">${state.viewerTahap}</span></span></div><div><b id="hub-stage-classes">${payload.classes.filter(c=>tahunDalamTahap(c.year,state.viewerTahap)&&Object.values(c.awards).some(a=>a.length)).length} / ${state.viewerTahap===1?26:16}</b><span>Kelas diterbitkan</span></div><button class="btn btn-outline" id="hub-refresh">↻ Muat semula</button></div><div class="card hub-search"><div class="tahap-switch viewer-tahap" role="group" aria-label="Pilih tahap penerima"><button data-view-stage="1" class="${state.viewerTahap===1?'active':''}" aria-pressed="${state.viewerTahap===1}">Tahap 1 <small>Tahun 1–3</small></button><button data-view-stage="2" class="${state.viewerTahap===2?'active':''}" aria-pressed="${state.viewerTahap===2}">Tahap 2 <small>Tahun 4–5</small></button></div><label for="view-search">Cari penerima anugerah</label><input id="view-search" type="search" placeholder="Taip nama penuh atau sebahagian nama…" autocomplete="off"><div class="hub-filters"><div class="field"><label for="view-year">Tahun</label><select id="view-year"><option value="0">Semua tahun</option>${(state.viewerTahap===1?[1,2,3]:[4,5]).map(y=>`<option value="${y}">Tahun ${y}</option>`).join('')}</select></div><div class="field"><label for="view-class">Kelas</label><select id="view-class"></select></div><div class="field"><label for="view-category">Anugerah</label><select id="view-category"><option value="">Semua anugerah</option>${payload.categories.filter(c=>kategoriDalamTahap(c,state.viewerTahap)&&students.some(p=>p.awards.some(a=>a.id===c.id))).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div></div></div><div class="hub-result-heading"><p id="hub-result-count" role="status" aria-live="polite"></p><button class="btn btn-small btn-outline" id="hub-clear">Set semula</button></div><div id="view-results" class="recipient-grid"></div><div id="hub-pagination" class="hub-pagination"></div></section><section id="hub-event" role="tabpanel" aria-labelledby="hub-tab-event" hidden>${event?eventMarkup(event):`<div class="card hub-empty"><span aria-hidden="true">◷</span><h2>Maklumat majlis akan menyusul</h2><p>Tarikh, tempat dan atur cara rasmi akan dipaparkan selepas diterbitkan oleh urus setia.</p></div>`}${extra[0].status==='rejected'?'<div class="notice warning">Maklumat majlis tidak dapat dimuatkan. Cuba muat semula.</div>':''}<div class="card hub-guide"><h3>Persediaan sebelum hadir</h3><ul><li>Semak nama, kelas dan kategori anugerah yang telah disahkan.</li><li>Rujuk masa hadir, lokasi dan panduan pakaian daripada urus setia.</li><li>Jika terdapat kesilapan nama atau kelas, hubungi guru kelas untuk semakan.</li></ul></div></section><section id="hub-news" role="tabpanel" aria-labelledby="hub-tab-news" hidden>${announcements.length?announcementsHTML(announcements):'<div class="card hub-empty"><span aria-hidden="true">◉</span><h2>Tiada pengumuman baharu</h2><p>Makluman rasmi urus setia akan dipaparkan di sini.</p></div>'}${extra[1].status==='rejected'?'<div class="notice warning">Pengumuman tidak dapat dimuatkan. Cuba muat semula.</div>':''}<div class="card hub-guide"><h3>Soalan lazim</h3><details><summary>Nama belum muncul. Adakah murid tidak menerima anugerah?</summary><p>Belum tentu. Senarai mungkin masih dalam semakan atau belum diterbitkan. Semak semula kemudian atau hubungi guru kelas.</p></details><details><summary>Bagaimana membetulkan ejaan nama?</summary><p>Maklumkan kepada guru kelas. Urus setia boleh membuka semula pengisian dan menerbitkan senarai yang telah dibetulkan.</p></details><details><summary>Boleh simpan kad penerima?</summary><p>Tekan nama penerima untuk membuka kad, kemudian pilih Cetak / Simpan PDF. Kad ini ialah rujukan portal, bukan sijil rasmi.</p></details></div></section>${state.me.role==='viewer'?'':'<button id="view-back" class="btn btn-outline hub-back">← Kembali ke ruang kerja</button>'}`,'published');
 const selectTab=id=>{for(const name of ['results','event','news']){const active=name===id;$("hub-tab-"+name).setAttribute('aria-selected',String(active));$("hub-tab-"+name).tabIndex=active?0:-1;$("hub-"+name).hidden=!active;}};
 const tabs=[...document.querySelectorAll('.hub-tabs [role="tab"]')];tabs.forEach((b,i)=>{b.onclick=()=>selectTab(b.id.replace('hub-tab-',''));b.onkeydown=e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();};});
 if(state.me.role!=='viewer')$('view-back').onclick=()=>state.me.role==='admin'?(state.mode==='class'?showTeacher():state.mode==='work'?showWork():showAdmin()):state.me.role==='specialist'?showWork():showTeacher();
 const fillClasses=()=>{const year=+$('view-year').value,old=$('view-class').value;$('view-class').innerHTML='<option value="">Semua kelas</option>'+payload.classes.filter(c=>tahunDalamTahap(c.year,state.viewerTahap)&&(!year||c.year===year)).map(c=>`<option value="${esc(c.classId)}">${esc(c.year+' '+c.className)}</option>`).join('');if([...$('view-class').options].some(o=>o.value===old))$('view-class').value=old;};
 const render=()=>{const q=$('view-search').value.trim().toLocaleLowerCase('ms'),year=+$('view-year').value,cls=$('view-class').value,category=$('view-category').value;visible=students.filter(p=>tahunDalamTahap(p.year,state.viewerTahap)&&(!q||p.name.toLocaleLowerCase('ms').includes(q))&&(!year||p.year===year)&&(!cls||p.classId===cls)&&(!category||p.awards.some(a=>a.id===category)));const pages=Math.max(1,Math.ceil(visible.length/12));page=Math.min(page,pages);$('hub-result-count').textContent=visible.length+' penerima sepadan'+(q?' dengan carian':'');$('view-results').innerHTML=visible.length?visible.slice((page-1)*12,page*12).map((p,i)=>`<button class="recipient-card" data-recipient="${(page-1)*12+i}" aria-haspopup="dialog"><span class="recipient-emblem" aria-hidden="true">♜</span><span><small>${esc(p.label)}</small><strong>${esc(p.name)}</strong><span class="recipient-awards">${p.awards.length} anugerah · Lihat kad ↗</span></span></button>`).join(''):`<div class="card hub-empty"><span aria-hidden="true">${students.length?'⌕':'♜'}</span><h2>${students.length?'Tiada padanan carian':'Senarai sedang disediakan'}</h2><p>${students.length?'Cuba ejaan lain atau set semula penapis.':'Senarai penerima belum diterbitkan. Ini tidak bermakna murid tidak menerima anugerah.'}</p><button class="btn btn-outline" id="hub-empty-action">${students.length?'Set semula carian':'Lihat info majlis'}</button></div>`;$('hub-pagination').innerHTML=visible.length>12?`<button id="hub-prev" class="btn btn-outline" ${page===1?'disabled':''}>← Sebelum</button><span>Halaman ${page} / ${pages}</span><button id="hub-next" class="btn btn-outline" ${page===pages?'disabled':''}>Seterusnya →</button>`:'';document.querySelectorAll('[data-recipient]').forEach(b=>b.onclick=()=>openRecipient(visible[+b.dataset.recipient],event));if($('hub-prev'))$('hub-prev').onclick=()=>{page--;render();};if($('hub-next'))$('hub-next').onclick=()=>{page++;render();};if($('hub-empty-action'))$('hub-empty-action').onclick=()=>students.length?clear():selectTab('event');};
 const clear=()=>{$('view-search').value='';$('view-year').value='0';fillClasses();$('view-class').value='';$('view-category').value='';page=1;render();};$('hub-clear').onclick=clear;$('hub-refresh').onclick=()=>showViewer();$('view-search').oninput=()=>{page=1;render();};$('view-year').onchange=()=>{fillClasses();page=1;render();};for(const id of ['view-class','view-category'])$(id).onchange=()=>{page=1;render();};document.querySelectorAll('[data-view-stage]').forEach(btn=>btn.onclick=()=>{state.viewerTahap=+btn.dataset.viewStage;document.querySelectorAll('[data-view-stage]').forEach(b=>{b.classList.toggle('active',+b.dataset.viewStage===state.viewerTahap);b.setAttribute('aria-pressed',String(+b.dataset.viewStage===state.viewerTahap));});$('view-year').innerHTML='<option value="0">Semua tahun</option>'+(state.viewerTahap===1?[1,2,3]:[4,5]).map(y=>'<option value="'+y+'">Tahun '+y+'</option>').join('');$('view-category').innerHTML='<option value="">Semua anugerah</option>'+payload.categories.filter(c=>kategoriDalamTahap(c,state.viewerTahap)).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');$('hub-stage-name').textContent=String(state.viewerTahap);$('hub-stage-recipients').textContent=String(students.filter(p=>tahunDalamTahap(p.year,state.viewerTahap)).length);$('hub-stage-classes').textContent=payload.classes.filter(c=>tahunDalamTahap(c.year,state.viewerTahap)&&Object.values(c.awards).some(a=>a.length)).length+' / '+(state.viewerTahap===1?26:16);fillClasses();page=1;render();});fillClasses();render();if(!students.length){document.querySelector('.hub-search').hidden=true;document.querySelector('.hub-result-heading').hidden=true;}
 if(event&&$('hub-calendar'))$('hub-calendar').onclick=()=>downloadCalendar(event);
}
function eventMarkup(event){const date=event.date?new Date(event.date+'T00:00:00+08:00').toLocaleDateString('ms-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kuching'}):'';return `<article class="card event-card"><span class="eyebrow">MAKLUMAT RASMI MAJLIS</span><h2>${esc(event.title)}</h2><div class="event-facts"><div><small>◷ Tarikh &amp; masa</small><strong>${esc(date)}</strong><span>${esc(event.time)} · Waktu Malaysia</span></div><div><small>⌖ Tempat</small><strong>${esc(event.venue)}</strong></div>${event.dresscode?`<div><small>✧ Panduan pakaian</small><strong>${esc(event.dresscode)}</strong></div>`:''}</div><div class="event-actions"><a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}">⌖ Buka peta</a><button class="btn btn-outline" id="hub-calendar">＋ Simpan ke kalendar</button></div>${event.schedule?`<details class="hub-schedule"><summary>Atur cara majlis</summary><ol>${event.schedule.split('\n').filter(x=>x.trim()).map(line=>{const pos=line.indexOf('|');return `<li>${pos>0?`<time>${esc(line.slice(0,pos).trim())}</time><span>${esc(line.slice(pos+1).trim())}</span>`:`<span>${esc(line)}</span>`}</li>`;}).join('')}</ol></details>`:''}${event.guidance?`<div class="notice announcement-text">${esc(event.guidance)}</div>`:''}</article>`;}
function foldCalendarLine(line){let out='',bytes=0;const encoder=new TextEncoder();for(const c of line){const n=encoder.encode(c).length;if(bytes+n>75){out+='\r\n ';bytes=1;}out+=c;bytes+=n;}return out;}
function downloadCalendar(event){const escape=v=>v.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const start=new Date(event.date+'T'+event.time+':00+08:00').toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');downloadText(['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MaPeM SKPT//Portal//MS','BEGIN:VEVENT','UID:mapem-'+event.date+'@mapem-skpt-2026.pages.dev','DTSTAMP:'+stamp,'DTSTART:'+start,'SUMMARY:'+escape(event.title),'LOCATION:'+escape(event.venue),'DESCRIPTION:'+escape(event.guidance||''),'END:VEVENT','END:VCALENDAR'].map(foldCalendarLine).join('\r\n')+'\r\n','mapem-skpt-2026.ics','text/calendar;charset=utf-8');}
function downloadText(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function openRecipient(person,event){
 document.querySelector('#recipient-dialog')?.remove();const dialog=document.createElement('dialog');dialog.id='recipient-dialog';dialog.className='app-dialog recipient-dialog';dialog.setAttribute('aria-labelledby','recipient-dialog-title');
 const eventDate=event?.date?new Date(event.date+'T00:00:00+08:00').toLocaleDateString('ms-MY',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kuching'}):'';
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">KENANGAN SEBUAH KEJAYAAN</span><h2 id="recipient-dialog-title">Kad penerima</h2></div><button class="icon-btn" id="recipient-close" aria-label="Tutup kad">×</button></div><div class="dialog-body"><article class="recipient-certificate" aria-label="Kad penerima MaPeM bertema songket"><img class="recipient-songket" src="/assets/songket-card.svg" alt="" aria-hidden="true"><div class="recipient-inner"><div class="certificate-brand"><img src="/icon-192.png?v=7" alt="Logo MaPeM"><span class="certificate-wordmark">MaPeM <em>SKPT 2026</em></span><span class="certificate-school">SEKOLAH KEBANGSAAN PEKAN TELIPOK</span></div><div class="certificate-main"><div class="certificate-ornament" aria-hidden="true"><span></span><b>✦</b><span></span></div><p class="certificate-kicker">SETINGGI-TINGGI TAHNIAH</p><h2 class="recipient-name">${esc(person.name)}</h2><span class="certificate-class">${esc(person.label)}</span><div class="certificate-award-heading"><span>ANUGERAH YANG DITERIMA</span><b>${person.awards.length}</b></div><ul class="certificate-awards">${person.awards.map((a,i)=>`<li><span class="certificate-award-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span>${esc(a.title)}</span></li>`).join('')}</ul>${event?`<div class="certificate-event"><div><span>TARIKH &amp; MASA</span><strong>${esc(eventDate)} · ${esc(event.time)}</strong></div><div><span>TEMPAT MAJLIS</span><strong>${esc(event.venue)}</strong></div></div>`:''}<p class="certificate-note">Rujukan senarai yang diterbitkan urus setia.<br>Kad ini bukan sijil rasmi.</p></div><div class="certificate-motto"><span aria-hidden="true">✦</span><p>Melakar Prestasi,<br><em>Menjulang Tradisi</em></p><span aria-hidden="true">✦</span></div></div></article></div><div class="dialog-actions"><span class="hint">Cetak atau pilih Simpan sebagai PDF pada peranti.</span><button class="btn" id="recipient-print">↓ Cetak / Simpan PDF</button></div>`;
 document.body.append(dialog);$('recipient-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});$('recipient-print').onclick=()=>window.print();dialog.showModal();
}
function listToText(x){return (x?.names||[]).join('\n');}function textareaList(id){return ($('txt-'+id)?.value||'').split(/\r?\n/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);}
function saveInfo(id,msgValue,status){const label=$('save-'+id);if(label){label.textContent=msgValue;label.className='save-status '+(status||'');if(status==='ok'){label.closest('dialog')?.querySelector('.dialog-message')?.remove();toast.classList.remove('show');}}}
function sameNames(a,b){return JSON.stringify(a||[])===JSON.stringify(b||[]);}
function isSafeTeacherAppend(base,server,local,max=5){
 const norm=a=>String(a).trim().replace(/\s+/g,' ').toLocaleLowerCase('ms');
 const prefix=(x,y)=>Array.isArray(x)&&Array.isArray(y)&&x.length<=y.length&&x.every((n,i)=>norm(n)===norm(y[i]));
 return prefix(base,server)&&prefix(server,local)&&local.length<=max&&new Set(local.map(norm)).size===local.length;
}
function teacherConflictStatus(id,text){saveInfo(id,text,'err');}
async function getLatestTeacherDraft(id){
 const response=await api('teacher/class');
 if(response.class.id!==state.teacherData?.class.id)throw Error('Penugasan kelas telah berubah. Jangan tutup borang; salin nama sebelum memuat semula.');
 return {draft:response.drafts[id]||{names:[],version:0},class:response.class};
}
async function showTeacherSaveConflict(id){
 const conflict=state.conflicts[id];
 if(!conflict)return;
 if($('teacher-conflict-dialog')){const existing=$('teacher-conflict-dialog');if(!existing.open)existing.showModal();return;}
 const dialog=document.createElement('dialog');
 dialog.id='teacher-conflict-dialog';dialog.className='app-dialog teacher-conflict-dialog';
 const server=conflict.remote,local=textareaList(id),max=state.teacherData.categories.find(c=>c.id===id)?.classLimit||5;
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">ELAK DATA DITINDIH</span><h2>Ada perubahan pada senarai ini</h2></div><button type="button" class="icon-btn" id="teacher-conflict-close" aria-label="Tutup">×</button></div><div class="dialog-body"><div class="notice warning">Sistem mempunyai versi nama yang lebih baharu. Nama yang anda taip <strong>masih kekal dalam borang</strong>. Semak sebelum memilih tindakan.</div><div class="teacher-sync-compare"><div><strong>Nama dalam database (${server.names.length})</strong><ol>${server.names.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div><div><strong>Nama yang ditaip (${local.length})</strong><ol>${local.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div></div><p class="hint">Kuota bagi kategori ini: ${max} orang. Simpanan akan disemak semula supaya perubahan baharu pengguna lain tidak ditindih secara senyap.</p><p id="teacher-conflict-msg" class="save-status" role="status"></p></div><div class="dialog-actions teacher-conflict-actions"><button type="button" id="teacher-conflict-copy" class="btn btn-outline">Salin nama saya</button><button type="button" id="teacher-conflict-stored" class="btn btn-outline">Guna nama tersimpan</button><button type="button" id="teacher-conflict-mine" class="btn btn-green">Simpan nama saya</button></div>`;
 document.body.append(dialog);
 const status=$('teacher-conflict-msg');
 const close=()=>dialog.close();
 $('teacher-conflict-close').onclick=close;
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 $('teacher-conflict-copy').onclick=async()=>{
  const names=textareaList(id).join('\n');
  try{await navigator.clipboard.writeText(names);status.textContent='Nama yang ditaip berjaya disalin.';}
  catch{status.textContent='Pilih teks dalam kotak nama asal, kemudian salin secara manual.';}
 };
 $('teacher-conflict-stored').onclick=async()=>{
  if(!confirm('Gantikan nama yang ditaip dengan senarai dari database? Perubahan belum disimpan akan hilang.'))return;
  const button=$('teacher-conflict-stored');button.disabled=true;
  try{
   const fresh=await getLatestTeacherDraft(id);
   state.teacherData.drafts[id]=fresh.draft;
   $('txt-'+id).value=fresh.draft.names.join('\n');
   delete state.conflicts[id];state.pendingEdit[id]=false;
   saveInfo(id,'✓ Senarai terkini dari database dipaparkan','ok');
   updateTeacherSummary();dialog.close();
  }catch(e){status.textContent=e.message;button.disabled=false;}
 };
 $('teacher-conflict-mine').onclick=async()=>{
  const selected=textareaList(id);
  if(selected.length>max){status.textContent='Maksimum '+max+' nama. Sila semak senarai sebelum menyimpan.';return;}
  if(!confirm('Simpan '+selected.length+' nama yang ditaip sebagai senarai baharu? Nama dalam database yang tiada pada senarai ini mungkin digantikan.'))return;
  const button=$('teacher-conflict-mine');button.disabled=true;status.textContent='Mengesahkan versi terkini dan menyimpan...';
  try{
   const fresh=await getLatestTeacherDraft(id);
   if(fresh.class.status!=='draft')throw Error('Senarai kelas sudah dihantar. Minta Admin membuka semula pengisian.');
   if(!sameNames(fresh.draft.names,server.names)||fresh.draft.version!==server.version){
    state.conflicts[id]={remote:fresh.draft};status.textContent='Data berubah lagi. Tutup mesej ini dan tekan Simpan untuk menyemak versi terbaru.';return;
   }
   state.teacherData.drafts[id]=fresh.draft;
   delete state.conflicts[id];
   dialog.close();
   await saveTeacher(id);
  }catch(e){status.textContent=e.message;}
  finally{button.disabled=false;}
 };
 dialog.showModal();
}
async function saveTeacher(id){
 const data=state.teacherData;
 if(!data||data.class.status!=='draft')return false;
 if(state.conflicts[id]){await showTeacherSaveConflict(id);return false;}
 if(state.saving[id]){state.pendingEdit[id]=true;return false;}
 let latest=textareaList(id);
 let previous=data.drafts[id]||{names:[],version:0};
 if(sameNames(latest,previous.names)){saveInfo(id,'✓ Disimpan','ok');return true;}
 state.saving[id]=true;state.pendingEdit[id]=false;
 saveInfo(id,'Menyimpan...');
 let success=false;
 let needsConflictDialog=false;
 try{
  for(let attempt=0;attempt<2;attempt++){
   try{
    const saved=await api('teacher/save','POST',{categoryId:id,version:previous.version,names:latest});
    data.drafts[id]={names:latest,version:saved.version};
    success=true;
    if(sameNames(textareaList(id),latest)){
     saveInfo(id,'✓ '+latest.length+' nama disimpan','ok');
    }else{
     state.pendingEdit[id]=true;
     saveInfo(id,'Perubahan terbaru menunggu simpan...');
    }
    break;
   }catch(err){
    if(err.status!==409)throw err;
    const remoteData=await getLatestTeacherDraft(id);
    const server=remoteData.draft;
    if(remoteData.class.status!=='draft')throw Error('Senarai sudah dihantar. Hubungi Admin untuk membuka semula.');
    const currentLocal=textareaList(id);
    if(sameNames(currentLocal,server.names)){
     data.drafts[id]=server;success=true;
     saveInfo(id,'✓ '+server.names.length+' nama telah tersimpan','ok');
     break;
    }
    const limit=data.categories.find(c=>c.id===id)?.classLimit||5;
    if(attempt===0&&isSafeTeacherAppend(previous.names,server.names,currentLocal,limit)){
     data.drafts[id]=server;previous=server;latest=currentLocal;
     saveInfo(id,'Menyelaraskan tambahan nama...');
     continue;
    }
    state.conflicts[id]={remote:server};
    teacherConflictStatus(id,'Perlu semak perubahan. Nama yang ditaip tidak hilang.');
    needsConflictDialog=true;
    break;
   }
  }
 }catch(err){
  saveInfo(id,'Gagal: '+err.message,'err');
  msg(err.message);
 }finally{
  state.saving[id]=false;
  if(needsConflictDialog)await showTeacherSaveConflict(id);
  else if(state.pendingEdit[id]&&!state.conflicts[id]){
   clearTimeout(state.timers[id]);
   state.timers[id]=setTimeout(()=>saveTeacher(id),220);
  }
 }
 return success;
}
async function finishSave(){
 for(const id of Object.keys(state.timers))clearTimeout(state.timers[id]);
 for(const c of state.teacherData.categories){
  const id=c.id;
  while(state.saving[id])await new Promise(r=>setTimeout(r,120));
  if(state.conflicts[id]){await showTeacherSaveConflict(id);throw Error('Semak konflik simpanan dahulu; nama yang ditaip masih berada dalam borang.');}
  const before=state.teacherData.drafts[id]||{names:[]};
  if(!sameNames(textareaList(id),before.names)){
   await saveTeacher(id);
   while(state.saving[id])await new Promise(r=>setTimeout(r,120));
   if(!sameNames(textareaList(id),state.teacherData.drafts[id]?.names||[]))
    throw Error('Ada nama yang belum berjaya disimpan. Semak status simpanan sebelum menghantar.');
  }
 }
}
async function showTeacher(){let result;try{result=await api('teacher/class');}catch(e){errorPage(e.message);return;}if(state.me.role==='admin')state.mode='class';state.teacherData=result;state.pendingEdit={};state.saving={};state.conflicts={};const c=result.class,locked=c.status==='submitted',total=Object.values(result.drafts).reduce((sum,v)=>sum+v.names.length,0);
mount(hero('Kelas '+c.year+' '+c.name,c.year===3?'Isi PBD dan empat pencalonan Tahun 3. Pilih kategori untuk bermula.':'Isi PBD sahaja: tepat 5 nama murid bagi kelas ini, '+(c.year<=3?'Tahap 1':'Tahap 2')+'.','RUANG KERJA GURU KELAS')+`<div class="teacher-panel"><section class="teacher-overview" aria-label="Ringkasan kelas"><div class="metric"><small>Nama direkod</small><b id="teacher-total">${total}</b><small>${c.year===3?'PBD dan pencalonan Tahun 3':'Penerima PBD'}</small></div><div class="metric"><small>Kategori berisi</small><b id="teacher-progress">0 / ${result.categories.length}</b><div class="bar"><div class="fill" id="teacher-bar"></div></div></div><div class="metric"><small>Status kelas</small><b class="metric-status">${locked?'Dihantar':'Draf'}</b><small>${locked?'Pengisian dikunci':'Masih boleh disunting'}</small></div></section><div class="save-notice ${locked?'locked':''}"><span aria-hidden="true">${locked?'✓':'↻'}</span><span>${locked?'Senarai akhir diterima. Hubungi urus setia jika pembetulan diperlukan.':'Autosave aktif. Buka kategori untuk menambah, mengubah atau memadam nama.'}</span></div><section id="award-section" class="award-section"><div class="section-title"><div><span class="section-kicker">${c.year===3?'PBD & PENCALONAN TAHUN 3':'PENGISIAN PBD'}</span><h2>Kategori anugerah</h2></div><span class="status draft">${result.categories.length} kategori</span></div><div class="award-grid">${result.categories.map((cat,i)=>{const d=result.drafts[cat.id]||{names:[],version:0};const quota=cat.scope==='year'?cat.quota?.[c.year]:cat.quota;return `<button class="award-card" data-open-award="${esc(cat.id)}" aria-haspopup="dialog"><span class="award-icon" aria-hidden="true">${['♜','✧','◈','❋','★','✦'][i%6]}</span><span class="award-copy"><strong>${esc(cat.nomination?'Pencalonan: '+cat.name:cat.name)}</strong><small>${cat.nomination?'Pencalonan Tahun 3 · 2 penerima akhir':cat.classLimit?'5 murid setiap kelas':quota==null?'Kuota belum ditetapkan':'Kuota keseluruhan: '+quota+' penerima'}</small></span><span class="award-card-bottom"><span id="count-${esc(cat.id)}" class="status draft">${d.names.length} nama</span><span class="award-action">${locked?'Lihat':'Isi nama'} <span aria-hidden="true">↗</span></span></span></button>`;}).join('')}</div></section><div class="submission-bar"><div><strong>${locked?'Senarai telah dihantar':'Sedia untuk menghantar?'}</strong><small>PBD: tepat 5 nama.${c.year===3?' Empat kategori lain ialah pencalonan Tahun 3 sahaja.':''}</small></div><button class="btn ${locked?'btn-outline':'btn-green'}" id="final-submit">${locked?'Lihat senarai akhir':'Semak & hantar →'}</button></div></div>`,'home');
const store=document.createElement('div');store.id='award-dialogs';store.innerHTML=result.categories.map(cat=>{const d=result.drafts[cat.id]||{names:[],version:0};return `<dialog class="app-dialog" id="dialog-${esc(cat.id)}" aria-labelledby="title-${esc(cat.id)}"><div class="dialog-heading"><div><span class="eyebrow">${esc(c.year+' '+c.name)} · PENCALONAN</span><h2 id="title-${esc(cat.id)}">${esc(cat.name)}</h2></div><span class="status ${locked?'submitted':'draft'}">${locked?'Dikunci':'Draf'}</span></div><div class="dialog-body">${cat.note?`<div class="notice">${esc(cat.note)}</div>`:''}<p class="editor-guide">Satu nama penuh pada setiap baris. Untuk memadam, buang baris nama berkenaan.</p><div class="field"><label for="txt-${esc(cat.id)}">${cat.nomination?'Nama calon':'Nama penerima PBD'}</label><textarea id="txt-${esc(cat.id)}" data-award="${esc(cat.id)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-gramm="false" ${locked?'disabled':''} placeholder="Taip nama penuh murid...">${esc(listToText(d))}</textarea></div><div class="editing"><span class="save-status" id="save-${esc(cat.id)}" role="status" aria-live="polite">${locked?'Pengisian dikunci':'Semua perubahan disimpan secara automatik'}</span><button class="btn btn-outline btn-small" data-save="${esc(cat.id)}" ${locked?'disabled':''}>Simpan sekarang</button></div></div><div class="dialog-actions"><span class="hint">${locked?'Hanya urus setia boleh membuka semula.':'Tunggu status Disimpan sebelum menutup.'}</span><button class="btn" data-close-editor="${esc(cat.id)}">Selesai</button></div></dialog>`;}).join('');root.append(store);
 document.querySelectorAll('[data-open-award]').forEach(b=>b.onclick=()=>{$('dialog-'+b.dataset.openAward).showModal();});
 document.querySelectorAll('[data-close-editor]').forEach(b=>{const id=b.dataset.closeEditor,dialog=$('dialog-'+id);b.onclick=()=>closeEditor(dialog,id);dialog.addEventListener('cancel',e=>{e.preventDefault();closeEditor(dialog,id);});});
 document.querySelectorAll('[data-award]').forEach(ta=>ta.oninput=()=>{const id=ta.dataset.award;updateTeacherSummary();saveInfo(id,'Menunggu simpan...');clearTimeout(state.timers[id]);state.timers[id]=setTimeout(()=>saveTeacher(id),800);});document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveTeacher(b.dataset.save));
 $('final-submit').onclick=openReview;updateTeacherSummary();
}

function pill(status,published){return published?'<span class="status published">Diterbitkan</span>':status==='submitted'?'<span class="status submitted">Dihantar</span>':'<span class="status draft">Draf</span>';}
function adminShell(){return hero('Pusat Pengurusan MaPeM','Urus pencalonan, akses guru dan senarai penerima mengikut tahap.','DASHBOARD URUS SETIA')+`<section class="section admin-section"><div class="tahap-switch" role="group" aria-label="Pilih tahap pengurusan"><button data-stage="1" aria-pressed="${state.tahap===1}" class="${state.tahap===1?'active':''}">Tahap 1 <small>Tahun 1–3 · 26 kelas</small></button><button data-stage="2" aria-pressed="${state.tahap===2}" class="${state.tahap===2?'active':''}">Tahap 2 <small>Tahun 4–5 · 16 kelas</small></button></div><div id="admin-content"></div></section>`;}

async function showAdmin(){try{state.overview=await api('admin/overview');state.me=(await api('me')).user;state.mode='admin';}catch(e){errorPage(e.message);return;}mount(adminShell(),state.tab);document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;showAdmin();});document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const tahap=+b.dataset.stage;if(state.tahap===tahap)return;if(!guardWorkChange())return;state.tahap=tahap;state.year=0;state.workCategory='';state.workClass='';showAdmin();});renderAdminTab();}
function renderAdminTab(){if(state.tab==='event')return renderEventEditor();if(state.tab==='announcement')return renderAnnouncementEditor();if(state.tab==='tasks')return renderCategoryAssignments();if(state.tab==='admins')return renderAdmins();if(state.tab==='teachers')return renderTeacherAssignments();if(state.tab==='special')return renderSpecial();if(state.tab==='quotas')return renderQuotas();if(state.tab==='titles')return renderAwardTitles();if(state.tab==='audit')return renderAuditLog();renderClassManager();}
function tahunDalamTahap(y,tahap=state.tahap){return tahap===1?y<=3:(y>=4&&y<=5);}
function kategoriDalamTahap(cat,tahap=state.tahap){const years=cat.years||Object.keys(cat.quota&&typeof cat.quota==='object'?cat.quota:{}).map(Number);return years.length===0||years.some(y=>tahunDalamTahap(+y,tahap));}
function metrics(d){const classes=d.classes.filter(c=>tahunDalamTahap(c.year)),submitted=classes.filter(c=>c.status==='submitted').length,published=classes.filter(c=>c.publishedAt).length,records=classes.reduce((n,c)=>n+c.total,0);return `<div class="metrics">${[['Jumlah Kelas',classes.length],['Senarai Dihantar',submitted],['Telah Diterbitkan',published],['Nama Direkod',records]].map(([label,value])=>`<div class="metric"><small>${label}</small><b>${value}</b></div>`).join('')}</div>`;}
function renderClassManager(){const d=state.overview;$('admin-content').innerHTML=metrics(d)+`<div class="section"><div class="section-title"><div><h2>Pengurusan Tahap ${state.tahap} · ${state.tahap===1?'26':'16'} Kelas</h2><p>Penerbitan senarai hanya dibuat selepas semakan dan kebenaran pihak sekolah.</p></div><div><button id="export" class="btn btn-outline">↓ Eksport laporan</button></div></div><div class="card"><div class="filter"><button class="btn btn-small ${state.year===0?'':'btn-outline'}" data-y="0">Semua</button>${(state.tahap===1?[1,2,3]:[4,5]).map(y=>`<button class="btn btn-small ${state.year===y?'':'btn-outline'}" data-y="${y}">Tahun ${y}</button>`).join('')}</div><div class="table-wrap"><table><thead><tr><th>Kelas</th><th>Nama</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${d.classes.filter(c=>tahunDalamTahap(c.year)&&(!state.year||state.year===c.year)).map(c=>`<tr><td><strong>${esc(c.year+' '+c.name)}</strong></td><td>${c.total}</td><td>${pill(c.status,c.publishedAt)}</td><td><button class="btn btn-outline btn-small" data-detail="${esc(c.id)}">Semak nama</button> <button class="btn btn-outline btn-small" data-correct="${esc(c.id)}">Betulkan PBD</button> ${c.status==='submitted'?`<button class="btn btn-green btn-small" data-publish="${esc(c.id)}">${c.publishedAt?'Terbit semula':'Terbitkan'}</button> <button class="btn btn-outline btn-small" data-reopen="${esc(c.id)}">Buka semula</button>`:''} ${c.publishedAt?`<button class="btn btn-red btn-small" data-unpublish="${esc(c.id)}">Tarik balik</button>`:''}</td></tr>`).join('')}</tbody></table></div></div><div id="class-detail" class="section"></div></div>`;
 document.querySelectorAll('[data-y]').forEach(b=>b.onclick=()=>{state.year=Number(b.dataset.y);renderClassManager();});document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>loadClassDetail(b.dataset.detail));document.querySelectorAll('[data-correct]').forEach(b=>b.onclick=()=>openPBDCorrection(b.dataset.correct));
 document.querySelectorAll('[data-publish]').forEach(b=>b.onclick=async()=>{if(!confirm('Terbitkan nama penerima kelas ini kepada semua pengguna Google yang log masuk? Pastikan kelulusan sekolah telah diperoleh.'))return;await runAdminAction('admin/publish',{classId:b.dataset.publish});});
 document.querySelectorAll('[data-unpublish]').forEach(b=>b.onclick=async()=>{if(confirm('Tarik balik senarai yang telah diterbitkan?'))await runAdminAction('admin/unpublish',{classId:b.dataset.unpublish});});
 document.querySelectorAll('[data-reopen]').forEach(b=>b.onclick=async()=>{if(confirm('Buka semula kelas ini untuk guru menyunting? Senarai yang diterbitkan akan ditarik balik.'))await runAdminAction('admin/class/status',{classId:b.dataset.reopen,status:'draft'});});
 $('export').onclick=openExportReport;}
async function loadClassDetail(id,target='class-detail'){
 let response;try{response=await api('admin/class?id='+encodeURIComponent(id));}catch(e){msg(e.message);return;}
 let dialog=$('class-detail-dialog');if(dialog)dialog.remove();dialog=document.createElement('dialog');dialog.id='class-detail-dialog';dialog.className='app-dialog class-review-dialog';dialog.setAttribute('aria-labelledby','detail-title');
 const cls=response.class,published=!!cls.published_at,submitted=cls.status==='submitted',label=cls.year+' '+cls.name,total=response.categories.reduce((n,c)=>n+(response.drafts[c.id]?.names.length||0),0);
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">SEMAKAN &amp; PENERBITAN</span><h2 id="detail-title">Senarai kelas ${esc(label)}</h2></div><button class="icon-btn" id="detail-close" aria-label="Tutup semakan">×</button></div><div class="dialog-body" id="detail-body"><div class="detail-state">${pill(cls.status,published)}<span>${total} rekod anugerah</span></div><div class="notice ${submitted?'':'warning'}" id="detail-publish-help">${submitted?(published?'Senarai kelas ini sudah diterbitkan. Terbit semula jika senarai kerja telah dikemas kini.':'Senarai akhir telah dihantar. Semak nama, kelas dan anugerah sebelum menerbitkan kepada guru dan ibu bapa.'):'Guru kelas belum menghantar senarai akhir. Guru perlu membuka Semakan akhir dan menekan Sahkan & hantar terlebih dahulu. Simpan automatik sahaja belum dikira sebagai penghantaran.'}</div><p class="hint">Hab Guru &amp; Ibu Bapa memaparkan salinan terakhir yang diterbitkan oleh urus setia.</p><div class="detail-awards">${response.categories.map(cat=>{const names=response.drafts[cat.id]?.names||[];return `<details ${names.length?'open':''}><summary><span>${esc(cat.name)}</span><b>${names.length}</b></summary>${names.length?`<ol class="name-list">${names.map(n=>`<li>${esc(n)}</li>`).join('')}</ol>`:'<p class="muted">Belum ada nama.</p>'}</details>`;}).join('')}</div><p id="detail-action-status" role="status" aria-live="polite" class="save-status"></p></div><div class="dialog-actions detail-actions"><button class="btn btn-outline" id="detail-done">Tutup</button><div>${published?'<button class="btn btn-red" id="detail-unpublish">Tarik balik</button>':''}<button class="btn btn-green" id="detail-publish" aria-describedby="detail-publish-help" ${submitted?'':'disabled'}>${published?'Terbit semula':'Terbitkan kelas'}</button></div></div>`;
 document.body.append(dialog);const close=()=>dialog.close();$('detail-close').onclick=close;$('detail-done').onclick=close;dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 const perform=async(action,button)=>{const publishing=action==='admin/publish';if(!confirm(publishing?'Terbitkan semua nama penerima yang diisi bagi kelas '+label+' kepada guru dan ibu bapa yang log masuk? Pastikan semakan dan kelulusan sekolah telah dibuat.':'Tarik balik senarai kelas '+label+' daripada paparan guru dan ibu bapa? Data pengisian dikekalkan.'))return;const status=$('detail-action-status');dialog.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=true);button.textContent=publishing?'Menerbitkan...':'Menarik balik...';try{await api(action,'POST',{classId:id});dialog.close();msg(publishing?'Senarai kelas '+label+' berjaya diterbitkan.':'Penerbitan kelas '+label+' telah ditarik balik.');await showAdmin();}catch(e){if(status.isConnected){status.textContent=e.message;status.className='save-status err';}if(dialog.isConnected){dialog.querySelectorAll('.detail-actions button').forEach(b=>b.disabled=false);$('detail-publish').disabled=!submitted;button.textContent=publishing?(published?'Terbit semula':'Terbitkan kelas'):'Tarik balik';}}};
 $('detail-publish').onclick=()=>perform('admin/publish',$('detail-publish'));if($('detail-unpublish'))$('detail-unpublish').onclick=()=>perform('admin/unpublish',$('detail-unpublish'));dialog.showModal();
}
async function runAdminAction(route,data){try{const result=await api(route,'POST',data);if(route==='admin/assign')state.teacherFeedback=result;if(route==='admin/unassign')state.teacherFeedback=null;await showAdmin();msg(route==='admin/assign'?'Penugasan guru kelas '+result.email+' disahkan dalam database.':'Perubahan berjaya disimpan.');}catch(e){msg(e.message);}}
async function renderAdmins(){
 const target=$('admin-content');target.innerHTML='<div class="empty">Memuatkan senarai pentadbir...</div>';
 let data;try{data=await api('admin/admins');}catch(e){if(state.tab==='admins')target.innerHTML=`<div class="notice warning">${esc(e.message)}</div>`;return;}if(state.tab!=='admins'||!target.isConnected)return;
 target.innerHTML=`<div class="section-title"><div><span class="section-kicker">AKSES & KEBENARAN</span><h2>Pengurusan pentadbir</h2><p>Tambah akaun Google yang dipercayai untuk membantu urus setia.</p></div><span class="status draft">${data.admins.length} pentadbir</span></div><div class="columns"><article class="card"><span class="admin-access-icon" aria-hidden="true">♙</span><h2>Tambah Admin</h2><p>Pentadbir boleh mengakses semua kelas, nama penerima, eksport CSV dan pengurusan akses pengguna.</p><form id="admin-grant-form"><div class="field"><label for="new-admin-email">E-mel Google pentadbir baharu</label><input id="new-admin-email" type="email" maxlength="254" required autocomplete="off" placeholder="nama@gmail.com"></div><div class="notice">Semak ejaan alamat sebelum memberi akses. Akaun baharu boleh log masuk menggunakan Google selepas ditambah.</div><button class="btn btn-full" id="admin-grant-submit" style="margin-top:18px">Tambah sebagai admin</button><p id="admin-access-message" class="save-status" role="status" aria-live="polite"></p></form></article><article class="card"><h2>Senarai pentadbir</h2><div class="admin-access-list">${data.admins.map(a=>`<div class="admin-access-row"><div><strong>${esc(a.email)}</strong><small>${a.protected?'Pentadbir utama · Dilindungi':a.email===state.me.email?'Akaun anda':'Ditambah oleh '+esc(a.granted_by||'pentadbir')}</small></div>${a.protected?'<span class="status draft">Utama</span>':a.email===state.me.email?'<span class="status submitted">Anda</span>':`<button class="btn btn-red btn-small" data-revoke-admin="${esc(a.email)}">Buang akses</button>`}</div>`).join('')}</div><p class="hint">Akses pentadbir utama ditetapkan melalui Cloudflare dan tidak boleh dibuang di sini.</p></article></div>`;
 $('admin-grant-form').onsubmit=async e=>{e.preventDefault();const email=$('new-admin-email').value.trim().toLowerCase();if(!confirm('Jadikan '+email+' pentadbir MaPeM? Akaun ini akan mendapat akses kepada semua kelas, data penerima dan pengurusan akses.'))return;const btn=$('admin-grant-submit');btn.disabled=true;btn.textContent='Menambah admin...';try{await api('admin/admins','POST',{email});msg('Pentadbir baharu berjaya ditambah.');await renderAdmins();}catch(e){$('admin-access-message').textContent=e.message;$('admin-access-message').className='save-status err';btn.disabled=false;btn.textContent='Tambah sebagai admin';}};
 document.querySelectorAll('[data-revoke-admin]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Buang akses pentadbir bagi '+btn.dataset.revokeAdmin+'? Akses guru kelas, jika ada, akan dikekalkan.'))return;btn.disabled=true;try{await api('admin/admins/revoke','POST',{email:btn.dataset.revokeAdmin});msg('Akses pentadbir telah dibatalkan.');await renderAdmins();}catch(e){msg(e.message);btn.disabled=false;}});
}

function guardWorkChange(){if(!state.workDirty&&!state.eventDirty)return true;if(!confirm('Ada perubahan yang belum disimpan. Abaikan perubahan dan teruskan?'))return false;state.workDirty=false;state.eventDirty=false;return true;}
async function showWork(){try{if(!guardWorkChange())return;state.workOverview=await api('work/overview?scope=mine');if(state.me.role==='admin')state.mode='work';mount(hero('Tugasan pengisian anugerah','Isi hanya kategori yang diberikan oleh urus setia. Semak kuota dan nota sebelum menyimpan.','GURU BERTUGAS / PENYELARAS')+'<section class="section" id="work-content"></section>','work');await renderWorkEditor('work-content');}catch(e){msg(e.message);}}
async function renderWorkEditor(targetId='admin-content'){
 const target=$(targetId),ownTasks=targetId==='work-content',scope=ownTasks?'?scope=mine':'';let overview;try{overview=await api('work/overview'+scope);}catch(e){target.innerHTML=`<div class="notice warning">${esc(e.message)}</div>`;return;}if(!target.isConnected)return;
 const categories=overview.categories.filter(c=>kategoriDalamTahap(c)&&(!ownTasks||(state.me.categoryAccess||[]).some(a=>a.id===c.id&&(a.tahap===0||a.tahap===state.tahap))));const workStage=ownTasks?`<div class="tahap-switch" role="group" aria-label="Tahap tugasan"><button data-work-stage="1" class="${state.tahap===1?'active':''}">Tahap 1 <small>Tahun 1–3</small></button><button data-work-stage="2" class="${state.tahap===2?'active':''}">Tahap 2 <small>Tahun 4–5</small></button></div>`:'';
 const bindStage=()=>target.querySelectorAll('[data-work-stage]').forEach(b=>b.onclick=()=>{if(!guardWorkChange())return;state.tahap=+b.dataset.workStage;state.workCategory='';state.workClass='';renderWorkEditor(targetId);});
 if(!categories.length){target.innerHTML=workStage+'<div class="notice">Tiada tugasan kategori bagi Tahap '+state.tahap+'. Pilih tahap lain jika berkenaan.</div>';bindStage();return;}
 if(!categories.some(c=>c.id===state.workCategory))state.workCategory=categories[0].id;
 target.innerHTML=workStage+`<div class="section-title"><div><h2>Pemilihan &amp; pengisian</h2><p>Tambah atau betulkan nama dalam senarai. Cerdas PLaN mempunyai dua kumpulan penerima: 3 PLaN dan 3 Pemulihan Khas, dikongsi merentasi kedua-dua tahap. Untuk memadam nama yang salah, buang baris nama dan tekan Simpan. Semua perubahan direkodkan dalam Log Aktiviti Admin.</p></div></div><div class="card"><div class="form-row"><div class="field"><label for="work-category">Kategori yang ditugaskan</label><select id="work-category">${categories.map(c=>`<option value="${esc(c.id)}" ${c.id===state.workCategory?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label for="work-class">Kelas penerima</label><select id="work-class"></select></div></div><div id="work-editor-body"><div class="empty">Memuatkan...</div></div></div>`;
 bindStage();const categorySelect=$('work-category'),classSelect=$('work-class');let data=null,generation=0;
 function fillClasses(){const c=categories.find(c=>c.id===categorySelect.value);const classes=overview.classes.filter(x=>tahunDalamTahap(x.year)&&(!c.years||c.years.includes(x.year)));if(!classes.some(x=>x.id===state.workClass))state.workClass=classes[0]?.id||'';classSelect.innerHTML=classes.map(x=>`<option value="${esc(x.id)}" ${x.id===state.workClass?'selected':''}>${esc(x.year+' '+x.name)}</option>`).join('');}
 function readNames(){return $('work-names').value.split(/\r?\n/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);}
 async function load(){const current=++generation;const classId=classSelect.value,categoryId=categorySelect.value;state.workCategory=categoryId;state.workClass=classId;$('work-editor-body').innerHTML='<div class="empty">Memuatkan...</div>';try{const r=await api('work/class?classId='+encodeURIComponent(classId)+'&categoryId='+encodeURIComponent(categoryId)+(ownTasks?'&scope=mine':''));if(current!==generation||!target.isConnected)return;data=r;state.workDirty=false;paint();}catch(e){if(current===generation&&target.isConnected)$('work-editor-body').innerHTML=`<div class="notice warning">${esc(e.message)}</div>`;}}
 function paint(){const c=data.category,quota=c.scope==='year'?c.quota?.[data.class.year]:c.quota,lp=c.nomination||c.id==='mawar';const currentNom=data.nominees.find(n=>n.classId===data.class.id)?.names||[];
 $('work-editor-body').innerHTML=`<div class="work-meta"><span class="status draft">${esc(c.owner)}</span><span class="status ${data.published?'published':'draft'}">${data.published?'Diterbitkan · Dikunci':quota==null?'Kuota belum ditetapkan':'Kuota '+(c.scope==='total'?(c.sharedAcrossStages?'gabungan Tahun 1–5':c.years?.length===1?'Tahun '+c.years[0]:(data.class.year<=3?'seluruh Tahap 1':'seluruh Tahap 2')):'Tahun '+data.class.year)+': '+quota}</span></div>${c.note?`<div class="notice">${esc(c.note)}</div>`:''}${data.published?'<div class="notice good" style="margin-top:12px">Senarai telah diterbitkan. Admin perlu menarik balik penerbitan sebelum pengisian boleh diubah.</div>':''}${c.nomination?`<section class="candidate-panel"><h3>Calon daripada guru kelas</h3><p>Ini ialah calon, bukan penerima automatik. Jika melebihi 2 calon, keputusan perlu dibuat oleh penyelaras atau melalui undian guru-guru.</p><div class="candidate-picks">${currentNom.length?currentNom.map((n,i)=>`<button class="btn btn-outline btn-small" data-pick-candidate="${i}" ${data.published?'disabled':''}>+ ${esc(n)}</button>`).join(''):'<span class="muted">Kelas ini belum mengemukakan calon.</span>'}</div><details class="all-candidates"><summary>Lihat calon ${c.years?.length===1?'Tahun '+c.years[0]:(data.class.year<=3?'seluruh Tahap 1':'seluruh Tahap 2')} (${data.nominees.reduce((s,n)=>s+n.names.length,0)} nama)</summary>${data.nominees.filter(n=>n.names.length).map(n=>`<div class="candidate-class"><strong>${esc(n.label)}</strong><ul>${n.names.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>${n.classId===data.class.id?'':`<button class="btn btn-outline btn-small" data-work-class="${esc(n.classId)}">Buka kelas ini</button>`}</div>`).join('')}</details></section>`:''}<div class="field"><label for="work-names">${c.nomination?'Penerima akhir yang dipilih':'Nama penerima'} · satu nama setiap baris</label><textarea id="work-names" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-gramm="false" ${data.published?'disabled':''} placeholder="${c.nomination?'Pilih daripada pencalonan kelas ini...':'Taip nama penuh murid...'}">${esc(data.draft.names.join('\n'))}</textarea></div>${lp?`<label class="check-row"><input type="checkbox" id="work-lp" ${data.confirmedLP?'checked':''} ${data.published?'disabled':''}><span>Saya mengesahkan semakan L/P${c.nomination?' dan keputusan penyelaras / undian guru-guru':''} telah dibuat.</span></label>`:''}<div class="editing"><span class="save-status" id="work-save-status" role="status" aria-live="polite">${data.draft.names.length} nama disimpan. Tekan Simpan selepas membuat perubahan.</span><button class="btn" id="work-save" ${data.published?'disabled':''}>Simpan penerima akhir</button></div>`;
 $('work-names').oninput=()=>{state.workDirty=true;$('work-save-status').textContent='Belum disimpan · '+readNames().length+' nama';};if($('work-lp'))$('work-lp').onchange=()=>{state.workDirty=true;};
 document.querySelectorAll('[data-pick-candidate]').forEach(b=>b.onclick=()=>{const names=readNames(),n=currentNom[+b.dataset.pickCandidate];if(!names.includes(n))names.push(n);$('work-names').value=names.join('\n');$('work-names').oninput();});
 document.querySelectorAll('[data-work-class]').forEach(b=>b.onclick=()=>{if(!guardWorkChange())return;classSelect.value=b.dataset.workClass;load();});
 $('work-save').onclick=async()=>{const btn=$('work-save');btn.disabled=true;$('work-save-status').textContent='Menyimpan...';try{const names=readNames();const r=await api('work/save'+scope,'POST',{classId:data.class.id,categoryId:c.id,names,version:data.draft.version,confirmedLP:$('work-lp')?.checked||false});data.draft={names,version:r.version};data.confirmedLP=true;state.workDirty=false;$('work-save-status').textContent='✓ Disimpan · '+names.length+' penerima akhir';$('work-save-status').className='save-status ok';msg('Penerima akhir berjaya disimpan.');}catch(e){$('work-save-status').textContent=e.message;$('work-save-status').className='save-status err';}finally{btn.disabled=false;}};
 }
 categorySelect.onchange=()=>{if(!guardWorkChange()){categorySelect.value=state.workCategory;return;}fillClasses();load();};classSelect.onchange=()=>{if(!guardWorkChange()){classSelect.value=state.workClass;return;}load();};fillClasses();await load();
}
function renderTaskSuccessBox(feedback){
 if(!feedback)return '';
 const suffix=feedback.registered?'Akaun Google telah dikenal pasti':'Akaun ini belum pernah log masuk ke MaPeM';
 const labels=feedback.labels||[];
 const subject=encodeURIComponent('Tugasan MaPeM SKPT 2026');
 const body=encodeURIComponent('Salam,\n\nAnda diberikan tugasan kategori anugerah berikut melalui portal MaPeM SKPT 2026:\n'+labels.map(x=>'- '+x).join('\n')+'\n\nSila buka https://mapem-skpt-2026.pages.dev dan log masuk menggunakan akaun Google: '+feedback.email+'\n\nJika tugasan tidak kelihatan, pastikan alamat Google yang digunakan sama dengan alamat ini dan muat semula portal.\n\nTerima kasih.');
 return `<div class="notice task-success" role="status" aria-live="polite"><strong>✓ ${feedback.assignedCount} tugasan telah disimpan dalam database</strong><p>E-mel ditugaskan: <strong>${esc(feedback.email)}</strong> · ${esc(suffix)}${feedback.googleName?' ('+esc(feedback.googleName)+')':''}.</p><p>Pemberian tugasan <strong>tidak menghantar e-mel automatik</strong>. Guru boleh log masuk melalui Google menggunakan alamat yang sama.</p><a class="btn btn-outline btn-small" href="mailto:${encodeURIComponent(feedback.email)}?subject=${subject}&body=${body}">✉ Buka e-mel pemberitahuan</a></div>`;
}
async function renderCategoryAssignments(){
 const target=$('admin-content');if(!target)return;
 target.innerHTML='<div class="empty">Memuatkan tugasan...</div>';
 let data;
 try{data=await api('admin/category-assignments');}
 catch(e){if(target.isConnected)target.innerHTML=`<div class="notice warning">${esc(e.message)}</div>`;return;}
 if(!target.isConnected||state.tab!=='tasks')return;
 const categories=data.categories.filter(c=>kategoriDalamTahap(c)),allAssignments=data.assignments||[];
 const assignments=allAssignments.filter(a=>categories.some(c=>c.id===a.category_id)&&(a.tahap===0||a.tahap===state.tahap));
 const owners=[...new Set(categories.map(c=>c.owner))];
 const feedback=state.taskFeedback;
 target.innerHTML=`<div class="section-title"><div><span class="section-kicker">AKSES GURU & PENYELARAS</span><h2>Pengagihan Tugasan · Tahap ${state.tahap}</h2><p>Masukkan e-mel Google guru secara manual atau pilih tugasan mengikut PIC. Tugasan disimpan sebagai akses portal, bukan dihantar terus ke peti masuk e-mel.</p></div><span class="status draft">${assignments.length} tugasan dipaparkan</span></div>
 ${renderTaskSuccessBox(feedback)}
 <div class="columns"><article class="card"><h2>Tambah tugasan kategori</h2><p>Guru kelas dan Admin juga boleh menerima tugasan kategori. Guru hanya boleh membuka kategori yang diberikan mengikut tahap.</p>
 <form id="category-assign-form">
 <div class="field"><label for="task-email">E-mel Google guru (boleh taip manual)</label><input id="task-email" type="email" required maxlength="254" autocomplete="email" placeholder="nama@moe-dl.edu.my"></div>
 <div class="task-email-check"><button type="button" class="btn btn-outline btn-small" id="task-check-email">Semak e-mel Google</button><span id="task-email-status" class="save-status" role="status" aria-live="polite">Gunakan e-mel yang sama seperti ketika guru log masuk Google ke MaPeM.</span></div>
 <div class="field"><label for="task-profile">Pilih panduan tugas</label><select id="task-profile"><option value="">Pilih secara manual</option>${owners.map((owner,i)=>`<option value="${i}">${esc(owner)}</option>`).join('')}</select></div>
 <div class="task-checks">${categories.map(c=>`<label class="check-row"><input type="checkbox" name="task-category" value="${esc(c.id)}"><span><strong>${esc(c.name)}</strong><small>${esc(c.owner)}${c.nomination?' · Pemilihan penerima daripada calon':''}</small></span></label>`).join('')}</div>
 <div class="notice">Pilih kategori dan tekan <strong>Simpan tugasan</strong>. Alamat akan dipadankan dengan akaun Google semasa guru log masuk. Jika belum pernah log masuk, tugasan tetap boleh disimpan dan akan muncul selepas guru menggunakan e-mel yang sama. Tukar tahap di bahagian atas untuk kategori lain.</div>
 <button class="btn btn-full" style="margin-top:16px" id="task-assign-submit" type="submit">Simpan tugasan</button>
 <p id="task-message" class="save-status" role="status" aria-live="polite"></p>
 </form></article>
 <article class="card"><h2>Senarai tugasan Tahap ${state.tahap}</h2><p class="hint">Dipaparkan mengikut tahap yang dipilih. Gunakan tab Tahap 1 / Tahap 2 untuk melihat tugasan lain; tugasan gabungan muncul pada kedua-duanya.</p>
 <div class="task-assignment-list">${assignments.length?assignments.map((a,i)=>`<div class="admin-access-row"><div><strong>${esc(a.email)}</strong><small>${esc(categories.find(c=>c.id===a.category_id)?.name||a.category_id)} · ${a.tahap===0?'Kedua-dua tahap':'Tahap '+a.tahap}</small><small class="${a.has_login?'assignment-verified':'assignment-pending'}">${a.has_login?'✓ Sudah log masuk Google'+(a.google_name?' · '+esc(a.google_name):''):'◷ Belum log masuk ke MaPeM menggunakan e-mel ini'}</small></div><button type="button" class="btn btn-red btn-small" data-task-revoke="${i}">Buang</button></div>`).join(''):'<p>Belum ada tugasan kategori bagi tahap ini.</p>'}</div></article></div>`;
 const emailInput=$('task-email'),checkButton=$('task-check-email'),emailStatus=$('task-email-status');
 const validateEmail=async()=>{
  const email=emailInput.value.trim().toLowerCase();
  if(!email||!emailInput.checkValidity()){emailStatus.textContent='Masukkan alamat e-mel Google yang sah dahulu.';emailStatus.className='save-status err';return;}
  checkButton.disabled=true;emailStatus.textContent='Memeriksa padanan e-mel...';emailStatus.className='save-status';
  try{
   const matched=await api('admin/assignment-email?email='+encodeURIComponent(email));
   if(emailInput.value.trim().toLowerCase()!==email)return;
   emailStatus.textContent=matched.registered?'✓ Akaun Google dikenali: '+matched.googleName+' ('+matched.email+')':'Belum pernah log masuk ke MaPeM. Tugasan masih boleh diberikan; guru mesti log masuk dengan e-mel '+matched.email+'.';
   emailStatus.className='save-status '+(matched.registered?'ok':'');
  }catch(e){if(emailInput.value.trim().toLowerCase()===email){emailStatus.textContent='Semakan e-mel gagal: '+e.message;emailStatus.className='save-status err';}}
  finally{checkButton.disabled=false;}
 };
 checkButton.onclick=validateEmail;
 emailInput.addEventListener('change',validateEmail);
 $('task-profile').onchange=()=>{
  const choice=$('task-profile').value,owner=choice===''?null:owners[Number(choice)];
  target.querySelectorAll('[name="task-category"]').forEach(input=>input.checked=owner!==null&&categories.find(c=>c.id===input.value)?.owner===owner);
 };
 $('category-assign-form').onsubmit=async e=>{
  e.preventDefault();
  const ids=[...target.querySelectorAll('[name="task-category"]:checked')].map(b=>b.value);
  const email=emailInput.value.trim().toLowerCase();
  if(!emailInput.checkValidity()){emailInput.reportValidity();return;}
  const message=$('task-message');
  if(!ids.length){message.textContent='Pilih sekurang-kurangnya satu kategori.';message.className='save-status err';return;}
  if(!confirm('Simpan '+ids.length+' tugasan kategori untuk '+email+' pada Tahap '+state.tahap+'? Ini memberikan akses dalam portal, bukan menghantar e-mel secara automatik.'))return;
  const button=$('task-assign-submit');button.disabled=true;button.textContent='Menyimpan dan mengesahkan...';
  message.textContent='Menyimpan tugasan dalam database...';message.className='save-status';
  try{
   const result=await api('admin/category-assignments','POST',{email,categoryIds:ids,tahap:state.tahap});
   state.taskFeedback={email:result.email,assignedCount:result.assigned.length,registered:result.registered,googleName:result.googleName,labels:result.assigned.map(x=>categories.find(c=>c.id===x.category_id)?.name||x.category_id)};
   await showAdmin();
  }catch(e){message.textContent='Gagal: '+e.message;message.className='save-status err';button.disabled=false;button.textContent='Cuba simpan semula';}
 };
 target.querySelectorAll('[data-task-revoke]').forEach(button=>button.onclick=async()=>{
  const a=assignments[Number(button.dataset.taskRevoke)];
  if(!a||!confirm('Buang akses '+a.category_id+' daripada '+a.email+'?'))return;
  button.disabled=true;
  try{
   await api('admin/category-assignments/revoke','POST',{email:a.email,categoryId:a.category_id});
   state.taskFeedback=null;
   await showAdmin();
   msg('Tugasan '+a.category_id+' dibatalkan untuk '+a.email+'.');
  }catch(e){msg(e.message);button.disabled=false;}
 });
}
window.addEventListener('beforeunload',e=>{if(state.workDirty||state.eventDirty){e.preventDefault();e.returnValue='';}});

function renderTeacherAssignments(){const d=state.overview,assignments=d.assignments.filter(a=>d.classes.some(c=>c.id===a.class_id&&tahunDalamTahap(c.year)));const feedback=state.teacherFeedback;$('admin-content').innerHTML=`${feedback?`<div class="notice task-success" role="status"><strong>✓ Penugasan guru kelas berjaya disimpan</strong><p>E-mel: <strong>${esc(feedback.email)}</strong> · Kelas ${esc(feedback.classId)} · ${feedback.registered?'Google dikenal pasti'+(feedback.googleName?' ('+esc(feedback.googleName)+')':''):'Guru belum pernah log masuk ke MaPeM menggunakan e-mel ini'}.</p><p>Tugasan ini memberi akses portal, bukan menghantar surat e-mel. Guru perlu log masuk ke MaPeM menggunakan e-mel Google yang sama.</p></div>`:''}<div class="columns"><div class="card"><h2>Tetapkan Guru Kelas</h2><p>Masukkan e-mel Google guru secara manual. Sistem mengesahkan tugasan dalam database; ia tidak menghantar e-mel automatik. Guru perlu log masuk dengan alamat Google yang sama. Akaun Admin yang juga guru kelas akan mempunyai pilihan Kelas Saya.</p><form id="assign-form"><div class="field"><label for="email">E-mel guru kelas</label><input id="email" type="email" required placeholder="contoh@gmail.com" autocomplete="off"></div><div class="field"><label for="class-select">Kelas yang ditugaskan</label><select id="class-select">${d.classes.filter(c=>tahunDalamTahap(c.year)).map(c=>`<option value="${esc(c.id)}">${esc(c.year+' '+c.name)}</option>`).join('')}</select></div><button class="btn btn-full">Simpan Penugasan</button></form><div class="notice" style="margin-top:14px">Guru kelas Tahun 1, 2, 4 dan 5 mengisi PBD (5 murid setiap kelas). Guru kelas Tahun 3 mengisi PBD dan empat pencalonan. Tugasan lain diberikan melalui menu Tugasan kategori. Jangan masukkan kata laluan Gmail di sini.</div></div><div class="card"><h2>Senarai Penugasan</h2><div class="table-wrap"><table><thead><tr><th>E-mel</th><th>Kelas</th><th></th></tr></thead><tbody>${assignments.length?assignments.map(a=>`<tr><td style="word-break:break-word">${esc(a.email)}</td><td>${esc(a.class_id)}</td><td><button class="btn btn-red btn-small" data-revoke="${esc(a.email)}">Buang</button></td></tr>`).join(''):'<tr><td colspan="3" class="empty">Belum ada guru kelas didaftarkan.</td></tr>'}</tbody></table></div></div></div>`;$('assign-form').onsubmit=async e=>{e.preventDefault();await runAdminAction('admin/assign',{email:$('email').value,classId:$('class-select').value});};document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{if(confirm('Batalkan akses pengisian bagi '+b.dataset.revoke+'?'))await runAdminAction('admin/unassign',{email:b.dataset.revoke});});}
async function renderSpecial(){await renderWorkEditor('admin-content');}

async function openPBDCorrection(id){
 let data;try{data=await api('admin/class?id='+encodeURIComponent(id));}catch(e){msg(e.message);return;}
 const c=data.class,label=c.year+' '+c.name,original=data.drafts.pbd||{names:[],version:0};
 if(c.published_at){msg('Kelas '+label+' sudah diterbitkan. Gunakan butang Tarik balik di Pengurusan Kelas sebelum membetulkan nama.');return;}
 document.querySelector('#pbd-correction-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='pbd-correction-dialog';dialog.className='app-dialog';
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">PEMBETULAN PBD · ADMIN</span><h2>Betulkan PBD — ${esc(label)}</h2></div><button class="icon-btn" id="correct-close" aria-label="Tutup">×</button></div><div class="dialog-body"><div class="notice warning">Setiap pembetulan akan merekod e-mel Google pentadbir, masa, nama sebelum/selepas dan sebab pembetulan dalam Log Aktiviti. Jika nama berkurang daripada lima, tambah nama yang betul sebelum penerbitan.</div><div class="field"><label for="correct-names">Nama murid (satu nama setiap baris, maksimum 5)</label><textarea id="correct-names" rows="7" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-gramm="false">${esc(original.names.join('\n'))}</textarea></div><div class="correction-list" id="correct-list"></div><div class="field"><label for="correct-reason">Sebab pembetulan <span aria-hidden="true">*</span></label><textarea id="correct-reason" rows="2" maxlength="400" placeholder="Contoh: Nama murid tersalah ejaan / tersalah senarai" required></textarea></div><p class="save-status" id="correct-status" role="status"></p></div><div class="dialog-actions"><button id="correct-cancel" class="btn btn-outline" type="button">Batal</button><button id="correct-save" class="btn" type="button">Sahkan &amp; simpan pembetulan</button></div>`;
 document.body.append(dialog);const read=()=>document.querySelector('#correct-names').value.split(/\r?\n/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);
 const draw=()=>{const names=read();$('correct-list').innerHTML=names.map((n,i)=>`<div class="correction-row"><span><b>${i+1}.</b> ${esc(n)}</span><button class="btn btn-red btn-small" data-remove-pbd="${i}" type="button" aria-label="Padam ${esc(n)}">Padam</button></div>`).join('')||'<p class="muted">Senarai kosong.</p>';dialog.querySelectorAll('[data-remove-pbd]').forEach(b=>b.onclick=()=>{const list=read();list.splice(+b.dataset.removePbd,1);$('correct-names').value=list.join('\n');draw();});};
 $('correct-names').oninput=draw;draw();$('correct-close').onclick=()=>dialog.close();$('correct-cancel').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 $('correct-save').onclick=async()=>{const list=read(),reason=$('correct-reason').value.trim();if(reason.length<5){$('correct-status').textContent='Sila nyatakan sebab pembetulan sekurang-kurangnya lima aksara.';return;}if(list.length>5){$('correct-status').textContent='PBD maksimum lima murid setiap kelas.';return;}if(JSON.stringify(list)===JSON.stringify(original.names)){$('correct-status').textContent='Tiada perubahan nama dikesan.';return;}if(!confirm('Simpan pembetulan bagi '+label+'? '+original.names.length+' nama lama → '+list.length+' nama baharu. Perubahan akan direkodkan.'))return;const btn=$('correct-save');btn.disabled=true;$('correct-status').textContent='Menyimpan pembetulan...';try{await api('admin/correct','POST',{classId:id,categoryId:'pbd',names:list,version:original.version,reason});dialog.close();msg('Pembetulan PBD berjaya disimpan dan direkodkan dalam Log Aktiviti.');await showAdmin();}catch(e){$('correct-status').textContent=e.message;btn.disabled=false;}};
 dialog.showModal();
}
async function renderAuditLog(){
 const target=$('admin-content');target.innerHTML='<div class="empty">Memuatkan Log Aktiviti...</div>';
 const classes=state.overview?.classes.filter(c=>tahunDalamTahap(c.year))||[];
 target.innerHTML=`<div class="section-title"><div><span class="section-kicker">JEJAK PENGISIAN</span><h2>Log Aktiviti — Tahap ${state.tahap}</h2><p>Rekod baharu memaparkan siapa mengisi, mengubah, membuang nama atau menerbitkan senarai.</p></div></div><div class="card"><div class="notice">Hanya Admin boleh melihat log ini. Rekod nama murid digunakan untuk mengesan pembetulan dan tidak boleh diakses oleh guru atau ibu bapa. Perubahan sebelum fungsi log diperkenalkan mungkin tiada nama pengisi asal.</div><form class="form-row" id="audit-filter"><div class="field"><label for="audit-actor">Cari e-mel pengisi</label><input id="audit-actor" type="search" placeholder="nama@gmail.com" autocomplete="off"></div><div class="field"><label for="audit-class">Kelas</label><select id="audit-class"><option value="">Semua kelas tahap ini</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.year+' '+c.name)}</option>`).join('')}</select></div><div class="field" style="justify-content:flex-end"><button class="btn" type="submit">Cari Log</button></div></form><div id="audit-result" role="status" aria-live="polite"></div></div>`;
 const load=async()=>{const result=$('audit-result');if(!result)return;result.innerHTML='<p class="muted">Memuatkan rekod...</p>';try{const q='?tahap='+state.tahap+'&limit=100&actor='+encodeURIComponent($('audit-actor').value.trim())+'&classId='+encodeURIComponent($('audit-class').value);const data=await api('admin/audit'+q),cats=new Map(data.categories.map(c=>[c.id,c.name]));result.innerHTML='<p class="hint">'+data.logs.length+' rekod terbaru dipaparkan. Masa mengikut Malaysia.</p>'+(!data.logs.length?'<div class="empty">Belum ada aktiviti bagi pilihan ini.</div>':`<div class="audit-feed">${data.logs.map(log=>{const before=JSON.parse(log.before_json||'[]'),after=JSON.parse(log.after_json||'[]'),added=after.filter(n=>!before.includes(n)),removed=before.filter(n=>!after.includes(n));const when=new Date(log.at).toLocaleString('ms-MY',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kuala_Lumpur'});const events={isi_nama:'Pengisian nama',padam_nama:'Padam nama',kosongkan_nama:'Kosongkan senarai',kemas_kini_nama:'Kemas kini nama',isi_pencalonan:'Isi pencalonan',padam_pencalonan:'Padam calon',kosongkan_pencalonan:'Kosongkan pencalonan',kemas_kini_pencalonan:'Ubah pencalonan',hantar_senarai:'Hantar senarai',terbit_senarai:'Terbitkan senarai',tarik_balik_terbitan:'Tarik balik penerbitan',tukar_nama_anugerah:'Tukar nama anugerah',buka_semula_kelas:'Buka semula kelas',tetap_status_kelas:'Ubah status kelas'};return `<article class="audit-entry"><div class="audit-heading"><strong>${esc(events[log.action]||log.action.replaceAll('_',' '))}</strong><time>${esc(when)}</time></div><p><b>${esc(log.actor_email)}</b> (${esc(log.actor_role==='teacher'?'Guru kelas':log.actor_role==='specialist'?'Penyelaras kategori':log.actor_role==='admin'?'Admin':log.actor_role)}) · ${esc(log.class_id?log.year+' '+log.class_name:'Kategori anugerah (semua tahap berkenaan)')} · ${esc(cats.get(log.category_id)||log.category_id||'Urusan kelas')}</p>${added.length?`<p class="audit-add">Ditambah: ${esc(added.join(', '))}</p>`:''}${removed.length?`<p class="audit-remove">Dibuang/diganti: ${esc(removed.join(', '))}</p>`:''}${log.note?`<p class="hint">Sebab/catatan: ${esc(log.note)}</p>`:''}${log.before_json!==null?`<details><summary>Lihat sebelum &amp; selepas</summary><div class="audit-diff"><div><b>Sebelum (${before.length})</b><ol>${before.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div><div><b>Selepas (${after.length})</b><ol>${after.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div></div></details>`:''}</article>`;}).join('')}</div>`);}catch(e){result.innerHTML='<div class="notice warning">'+esc(e.message)+'</div>';}};
 $('audit-filter').onsubmit=e=>{e.preventDefault();load();};await load();
}

async function renderAwardTitles(){
 const target=$('admin-content'),items=(state.overview?.categories||[]).filter(c=>kategoriDalamTahap(c));
 if(!target)return;
 target.innerHTML=`<div class="section-title"><div><span class="section-kicker">PENGURUSAN KATEGORI</span><h2>Nama Anugerah · Tahap ${state.tahap}</h2><p>Sunting tajuk anugerah tanpa mengubah ID, kuota atau nama penerima. Nama baharu digunakan dalam pengisian, paparan penerima dan eksport Excel.</p></div></div><div class="card award-title-panel"><div class="notice">Nama anugerah yang digunakan pada kedua-dua tahap akan berubah pada kedua-duanya. Semua suntingan direkodkan bersama akaun Google Admin, masa, nama sebelum dan selepas serta sebab perubahan.</div><div class="field"><label for="award-title-search">Cari nama anugerah</label><input id="award-title-search" type="search" placeholder="Contoh: PBD, UASA, NILAM, Sejarah..." autocomplete="off"></div><div id="award-title-items" class="award-title-list"></div></div>`;
 const list=$('award-title-items');
 const draw=()=>{
  const q=$('award-title-search').value.toLocaleLowerCase('ms').trim();
  const matches=items.filter(c=>(c.name+' '+c.defaultName+' '+c.id).toLocaleLowerCase('ms').includes(q));
  list.innerHTML=matches.map(c=>`<div class="award-title-item"><div class="award-title-main"><strong>${esc(c.name)}</strong><span class="hint">${c.customTitle?'Telah diubah · ':''}ID kekal: ${esc(c.id)}</span>${c.customTitle?`<small class="hint">Nama asal: ${esc(c.defaultName)}</small>`:''}</div><button type="button" class="btn btn-outline btn-small" data-award-title="${esc(c.id)}" aria-label="Sunting nama ${esc(c.name)}">✎ Sunting nama</button></div>`).join('')||'<div class="empty">Tiada anugerah yang sepadan.</div>';
  list.querySelectorAll('[data-award-title]').forEach(b=>b.onclick=()=>openAwardTitleEditor(items.find(c=>c.id===b.dataset.awardTitle)));
 };
 $('award-title-search').oninput=draw;draw();
}
function openAwardTitleEditor(cat){
 if(!cat)return;
 document.querySelector('#award-title-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='award-title-dialog';dialog.className='app-dialog';
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">SUNTING TAJUK RASMI</span><h2>${esc(cat.name)}</h2></div><button type="button" class="icon-btn" id="award-title-close" aria-label="Tutup">×</button></div><form id="award-title-form"><div class="dialog-body"><div class="notice">Menukar nama anugerah tidak menjejaskan senarai murid, kuota, akses guru atau rekod lama. Pertukaran ini juga akan muncul dalam Excel dan paparan penerima yang telah diterbitkan.</div><div class="field"><label for="award-title-input">Nama anugerah baharu</label><input id="award-title-input" type="text" required maxlength="130" minlength="3" autocomplete="off"></div><p class="hint">Nama asal: ${esc(cat.defaultName)}</p><button type="button" class="btn btn-outline btn-small" id="award-title-reset">↺ Gunakan semula nama asal</button><div class="field" style="margin-top:14px"><label for="award-title-reason">Sebab perubahan (wajib)</label><textarea id="award-title-reason" rows="2" maxlength="400" required placeholder="Contoh: Pembetulan nama rasmi mengikut keputusan urus setia"></textarea></div><p id="award-title-status" class="save-status" role="status" aria-live="polite"></p></div><div class="dialog-actions"><button type="button" class="btn btn-outline" id="award-title-cancel">Batal</button><button type="submit" class="btn" id="award-title-save">Sahkan & simpan nama</button></div></form>`;
 document.body.append(dialog);
 const input=$('award-title-input'),reason=$('award-title-reason'),status=$('award-title-status'),button=$('award-title-save');
 input.value=cat.name;
 const close=()=>dialog.close();
 $('award-title-close').onclick=close;$('award-title-cancel').onclick=close;
 $('award-title-reset').onclick=()=>{input.value=cat.defaultName;input.focus();};
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 $('award-title-form').onsubmit=async e=>{
  e.preventDefault();const title=input.value.trim().replace(/\s+/g,' '),why=reason.value.trim();
  if(title.length<3||title.length>130){status.textContent='Nama anugerah mesti 3–130 aksara.';return;}
  if(why.length<5){status.textContent='Sebab perubahan mesti sekurang-kurangnya 5 aksara.';return;}
  if(title===cat.name){status.textContent='Nama anugerah tidak berubah.';return;}
  if(!confirm('Tukar nama anugerah daripada "'+cat.name+'" kepada "'+title+'"? Semua paparan berkaitan akan menggunakan nama baharu.'))return;
  button.disabled=true;status.textContent='Menyimpan perubahan nama anugerah...';
  try{await api('admin/award-titles','POST',{categoryId:cat.id,title,reason:why,version:cat.titleVersion});close();msg('Nama anugerah dikemas kini dan direkodkan dalam Log Aktiviti.');await showAdmin();}
  catch(err){status.textContent=err.message;button.disabled=false;}
 };
 dialog.showModal();input.focus();
}
function renderQuotas(){const d=state.overview;const stats=d.categories.filter(c=>kategoriDalamTahap(c)).flatMap(c=>{if(c.scope==='year')return Object.entries(c.quota||{}).filter(([year])=>tahunDalamTahap(+year)).map(([year,limit])=>({label:c.name+' — Tahun '+year,limit,count:d.quota[c.id]?.[year]||0}));if(c.scope==='total')return [{label:c.name+(c.sharedAcrossStages?' · kuota gabungan Tahun 1–5':''),limit:c.quota,count:Object.entries(d.quota[c.id]||{}).filter(([y])=>c.sharedAcrossStages||tahunDalamTahap(+y)).reduce((a,[,b])=>a+b,0)}];return [];});$('admin-content').innerHTML=`<div class="card"><h2>Pemantauan Kuota</h2><p>Kuota mengikut Tahap ${state.tahap}, kecuali kategori gabungan yang dikira merentas kedua-dua tahap. Tahun 6 tidak termasuk.</p><div class="notice">Anugerah Cerdas PLaN: 3 murid PLaN + 3 murid Pemulihan Khas = 6 penerima keseluruhan (Tahun 1–5), tanpa pecahan kuota mengikut tahap.</div>${stats.map(v=>`<div class="quota"><div class="quota-head"><strong>${esc(v.label)}</strong><span>${v.limit==null?v.count+' · Kuota belum ditetapkan':v.count+' / '+v.limit}</span></div>${v.limit==null?'':`<div class="bar"><div class="fill ${v.count>v.limit?'over':''}" style="width:${Math.min(100,100*v.count/(v.limit||1))}%"></div></div>`}</div>`).join('')}</div>`;}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installEvent=e;installBtn.hidden=false;});installBtn.onclick=async()=>{if(!state.installEvent)return;await state.installEvent.prompt();state.installEvent=null;installBtn.hidden=true;};
window.addEventListener('appinstalled',()=>{installBtn.hidden=true;msg('Aplikasi MaPeM berjaya dipasang.');});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
boot();

function announcementDate(value){
 if(!value)return '';
 const raw=String(value);
 const date=new Date(raw.includes('T')?raw:raw.replace(' ','T')+'Z');
 return Number.isNaN(date.getTime())?'':date.toLocaleDateString('ms-MY',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'});
}
function announcementHTML(data){
 const stamp=announcementDate(data.updatedAt);
 return `<article class="portal-announcement ${data.pinned?'announcement-pinned':''}" aria-label="Pengumuman urus setia"><div class="announcement-head"><span class="eyebrow">${data.pinned?'✦ PENGUMUMAN UTAMA':'◉ PENGUMUMAN URUS SETIA'}</span>${stamp?`<time datetime="${esc(data.updatedAt)}">${esc(stamp)}</time>`:''}</div><h2>${esc(data.title)}</h2><p class="announcement-text">${esc(data.body)}</p></article>`;
}
function announcementsHTML(items,maxVisible=0){
 if(!items.length)return '';
 const visible=maxVisible?items.slice(0,maxVisible):items;
 const rest=maxVisible?items.slice(maxVisible):[];
 return `<div class="announcement-feed">${visible.map(announcementHTML).join('')}${rest.length?`<details class="announcement-more"><summary>Lihat ${rest.length} pengumuman lagi ↓</summary><div class="announcement-feed">${rest.map(announcementHTML).join('')}</div></details>`:''}</div>`;
}
async function loadLoginAnnouncement(){
 const target=$('login-announcement');
 try{
  const data=await api('portal/announcements');
  if(!target?.isConnected)return;
  if(!data.announcements?.length){target.hidden=true;return;}
  target.innerHTML=announcementsHTML(data.announcements,3);
  target.hidden=false;
 }catch{/* Login remains available if announcements cannot load. */}
}
async function renderAnnouncementEditor(){
 const target=$('admin-content');
 target.innerHTML='<div class="empty">Memuatkan senarai pengumuman...</div>';
 let data;
 try{data=await api('admin/announcements');}
 catch(e){if(target.isConnected)target.textContent=e.message;return;}
 if(!target.isConnected||state.tab!=='announcement')return;
 const list=data.announcements||[];
 const active=list.filter(x=>x.enabled).length;
 const formatTime=value=>{
  if(!value)return '';
  const str=String(value),d=new Date(str.includes('T')?str:str.replace(' ','T')+'Z');
  return Number.isNaN(d.getTime())?'':d.toLocaleString('ms-MY',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuala_Lumpur'});
 };
 target.innerHTML=`<div class="section-title"><div><span class="section-kicker">PENGURUSAN MAKLUMAN</span><h2>Pengumuman Portal</h2><p>Tambah makluman baharu. Setiap pengumuman boleh disunting, diterbitkan, disembunyikan, disemat atau dipadam secara berasingan.</p></div><button id="announcement-add" class="btn">＋ Pengumuman baharu</button></div><div class="announcement-dashboard-stats"><div><b>${list.length}</b><small>Jumlah pengumuman</small></div><div><b>${active}</b><small>Sedang diterbitkan</small></div><div><b>${list.length-active}</b><small>Draf / tersembunyi</small></div></div><div class="notice warning announcement-privacy">Pengumuman aktif boleh dibaca sebelum log masuk. Jangan sertakan maklumat sulit, nama murid atau nombor telefon peribadi.</div><div class="announcement-manage-list">${list.length?list.map(a=>`<article class="announcement-manage-item"><div class="announcement-manage-main"><div class="announcement-manage-flags"><span class="status ${a.enabled?'published':'draft'}">${a.enabled?'Diterbitkan':'Draf / tersembunyi'}</span>${a.pinned?'<span class="announcement-pin-label">✦ Disemat di atas</span>':''}</div><h3>${esc(a.title)}</h3><p class="announcement-manage-excerpt">${esc(a.body)}</p><small>${esc(formatTime(a.updated_at))}${a.updated_by?' · '+esc(a.updated_by):''}</small></div><div class="announcement-manage-actions"><button type="button" class="btn btn-outline btn-small" data-ann-edit="${a.id}">✎ Sunting</button><button type="button" class="btn btn-outline btn-small" data-ann-pin="${a.id}">${a.pinned?'Nyahsemat':'✦ Semat'}</button><button type="button" class="btn ${a.enabled?'btn-outline':'btn-green'} btn-small" data-ann-toggle="${a.id}">${a.enabled?'Sembunyikan':'Terbitkan'}</button><button type="button" class="btn btn-red btn-small" data-ann-delete="${a.id}">Padam</button></div></article>`).join(''):'<div class="card hub-empty"><h3>Belum ada pengumuman.</h3><p>Tekan Pengumuman baharu untuk menyediakan makluman pertama.</p></div>'}</div>`;
 $('announcement-add').onclick=()=>openAnnouncementEditor(null);
 const find=id=>list.find(a=>a.id===Number(id));
 const mutate=async(btn,route,body,success)=>{
  btn.disabled=true;
  try{await api(route,'POST',body);msg(success);await renderAnnouncementEditor();}
  catch(err){msg(err.message);btn.disabled=false;}
 };
 target.querySelectorAll('[data-ann-edit]').forEach(btn=>btn.onclick=()=>openAnnouncementEditor(find(btn.dataset.annEdit)));
 target.querySelectorAll('[data-ann-pin]').forEach(btn=>btn.onclick=()=>{
  const a=find(btn.dataset.annPin);if(!a)return;
  mutate(btn,'admin/announcements/update',{id:a.id,title:a.title,body:a.body,pinned:!a.pinned,enabled:a.enabled,version:a.version},a.pinned?'Pengumuman dinyahsemat.':'Pengumuman disemat di atas.');
 });
 target.querySelectorAll('[data-ann-toggle]').forEach(btn=>btn.onclick=()=>{
  const a=find(btn.dataset.annToggle);if(!a)return;
  if(!a.enabled&&!confirm('Terbitkan pengumuman ini untuk semua pelawat, termasuk sebelum log masuk?'))return;
  mutate(btn,'admin/announcements/update',{id:a.id,title:a.title,body:a.body,pinned:a.pinned,enabled:!a.enabled,version:a.version},a.enabled?'Pengumuman disembunyikan.':'Pengumuman diterbitkan.');
 });
 target.querySelectorAll('[data-ann-delete]').forEach(btn=>btn.onclick=()=>{
  const a=find(btn.dataset.annDelete);
  if(!a||!confirm('Padam pengumuman "'+a.title+'"? Pengumuman hilang daripada portal tetapi sejarah audit kekal.'))return;
  mutate(btn,'admin/announcements/delete',{id:a.id,version:a.version},'Pengumuman telah dipadam daripada senarai.');
 });
}
function openAnnouncementEditor(item){
 document.querySelector('#announcement-editor-dialog')?.remove();
 const dialog=document.createElement('dialog');
 dialog.id='announcement-editor-dialog';dialog.className='app-dialog announcement-editor-dialog';
 const isNew=!item;
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">${isNew?'MAKLUMAN BAHARU':'KEMAS KINI MAKLUMAN'}</span><h2>${isNew?'Tambah pengumuman':'Sunting pengumuman'}</h2></div><button type="button" class="icon-btn" id="ann-editor-close" aria-label="Tutup">×</button></div><form id="ann-editor-form"><div class="dialog-body"><div class="field"><label for="ann-title">Tajuk pengumuman</label><input id="ann-title" maxlength="120" minlength="3" required autocomplete="off" placeholder="Contoh: Makluman Hari Anugerah"></div><div class="field"><label for="ann-body">Mesej pengumuman</label><textarea id="ann-body" maxlength="3000" rows="6" required placeholder="Tulis pengumuman untuk guru dan ibu bapa..."></textarea><small class="hint">Maksimum 3000 aksara; teks biasa tanpa HTML.</small></div><label class="announcement-toggle"><input type="checkbox" id="ann-enabled"> Terbitkan kepada semua pelawat sekarang</label><label class="announcement-toggle"><input type="checkbox" id="ann-pinned"> ✦ Semat pengumuman di bahagian paling atas</label><div class="notice">Untuk menyimpan sebagai draf, biarkan kotak Terbitkan tidak ditandakan.</div><p id="ann-editor-status" class="save-status" role="status"></p><div class="announcement-editor-preview"><h3>Pratonton</h3><div id="ann-preview"></div></div></div><div class="dialog-actions"><button type="button" class="btn btn-outline" id="ann-editor-cancel">Batal</button><button type="submit" class="btn" id="ann-editor-save">${isNew?'Tambah pengumuman':'Simpan perubahan'}</button></div></form>`;
 document.body.append(dialog);
 const title=$('ann-title'),body=$('ann-body'),enabled=$('ann-enabled'),pinned=$('ann-pinned');
 title.value=item?.title||'';body.value=item?.body||'';enabled.checked=Boolean(item?.enabled);pinned.checked=Boolean(item?.pinned);
 const preview=()=>{$('ann-preview').innerHTML=announcementHTML({title:title.value||'Tajuk pengumuman',body:body.value||'Mesej pengumuman',pinned:pinned.checked,updatedAt:item?.updated_at||null});};
 for(const field of [title,body])field.oninput=preview;
 pinned.onchange=preview;enabled.onchange=preview;preview();
 const close=()=>dialog.close();$('ann-editor-close').onclick=close;$('ann-editor-cancel').onclick=close;
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 $('ann-editor-form').onsubmit=async e=>{
  e.preventDefault();
  const textTitle=title.value.trim(),textBody=body.value.trim(),btn=$('ann-editor-save'),status=$('ann-editor-status');
  if(textTitle.length<3||textTitle.length>120||!textBody||textBody.length>3000){status.textContent='Isi tajuk 3–120 aksara dan mesej sehingga 3000 aksara.';return;}
  if(enabled.checked&&!item?.enabled&&!confirm('Pengumuman ini akan dipaparkan kepada semua pelawat, termasuk sebelum log masuk. Teruskan?'))return;
  btn.disabled=true;status.textContent='Menyimpan pengumuman...';
  try{
   const route=isNew?'admin/announcements/create':'admin/announcements/update';
   await api(route,'POST',{...(item?{id:item.id,version:item.version}:{}),title:textTitle,body:textBody,enabled:enabled.checked,pinned:pinned.checked});
   dialog.close();msg(isNew?'Pengumuman baharu berjaya ditambah.':'Pengumuman berjaya dikemas kini.');
   await renderAnnouncementEditor();
  }catch(err){status.textContent=err.message;btn.disabled=false;}
 };
 dialog.showModal();title.focus();
}
async function renderEventEditor(){const target=$('admin-content');target.innerHTML='<div class="empty">Memuatkan maklumat majlis...</div>';let data;try{data=await api('admin/event');}catch(e){if(target.isConnected)target.textContent=e.message;return;}if(!target.isConnected||state.tab!=='event')return;const labels={title:'Nama majlis',date:'Tarikh',time:'Masa mula (waktu Malaysia)',venue:'Tempat / alamat lengkap',dresscode:'Panduan pakaian',schedule:'Atur cara — satu aktiviti setiap baris',guidance:'Panduan kehadiran / maklumat tambahan'};target.innerHTML=`<div class="section-title"><div><h2>Maklumat majlis</h2><p>Diterbitkan dalam Hab Guru &amp; Ibu Bapa. Isi maklumat yang telah disahkan sahaja.</p></div></div><form class="card" id="event-form"><div class="notice">Maklumat majlis yang diterbitkan ialah maklumat umum. Nama penerima tetap memerlukan log masuk dan penerbitan senarai berasingan.</div>${Object.entries(labels).map(([key,label])=>`<div class="field"><label for="event-${key}">${label}</label>${['schedule','guidance'].includes(key)?`<textarea id="event-${key}" rows="5" maxlength="${key==='schedule'?6000:3000}" placeholder="${key==='schedule'?'07:00 | Pendaftaran tetamu':''}">${esc(data.event[key])}</textarea>`:`<input id="event-${key}" type="${key==='date'?'date':key==='time'?'time':'text'}" maxlength="${key==='title'?120:key==='venue'?250:200}" value="${esc(data.event[key])}">`}</div>`).join('')}<label class="announcement-toggle"><input type="checkbox" id="event-enabled" ${data.enabled?'checked':''}> Terbitkan maklumat majlis</label><div class="dialog-actions"><span id="event-status" role="status" class="save-status">${data.enabled?'Sedang diterbitkan':'Belum diterbitkan'}</span><button class="btn" id="event-save">Simpan maklumat</button></div></form><section class="section"><h3>Pratonton sebelum diterbitkan</h3><div id="event-preview"></div></section>`;const read=()=>Object.fromEntries(Object.keys(labels).map(key=>[key,$('event-'+key).value]));const preview=()=>{$('event-preview').innerHTML=eventMarkup(read());const calendar=$('event-preview').querySelector('#hub-calendar');if(calendar)calendar.disabled=true;$('event-preview').querySelector('.event-actions')?.remove();};for(const key of Object.keys(labels))$('event-'+key).oninput=()=>{state.eventDirty=true;preview();};$('event-enabled').onchange=()=>{state.eventDirty=true;};preview();$('event-form').onsubmit=async e=>{e.preventDefault();const btn=$('event-save');btn.disabled=true;try{const result=await api('admin/event','POST',{event:read(),enabled:$('event-enabled').checked,version:data.version});data.version=result.version;state.eventDirty=false;$('event-status').textContent=$('event-enabled').checked?'Disimpan dan diterbitkan.':'Disimpan sebagai draf.';msg('Maklumat majlis berjaya disimpan.');}catch(e){$('event-status').textContent=e.message;}finally{btn.disabled=false;}};}

function openExportReport(){
 document.querySelector('#export-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.id='export-dialog';dialog.className='app-dialog';
 dialog.innerHTML='<div class="dialog-heading"><div><span class="eyebrow">LAPORAN MaPeM 2026</span><h2>Eksport Excel Mengikut Tahap</h2></div><button id="export-close" class="icon-btn" aria-label="Tutup eksport">×</button></div>'+
 '<form id="export-form"><div class="dialog-body"><div class="field"><label for="export-format">Format fail</label><select id="export-format"><option value="xlsx">Excel (.xlsx) — helaian berasingan</option><option value="csv">CSV</option></select><p class="hint">Excel: Ringkasan, helaian Tahap 1/2 dan kategori khusus setiap tahap.</p></div>'+
 '<div class="field"><label for="export-source">Jenis senarai</label><select id="export-source"><option value="working">Senarai kerja termasuk draf</option><option value="published">Senarai yang telah diterbitkan sahaja</option></select></div>'+
 '<div class="field"><label for="export-tahap">Eksport tahap</label><select id="export-tahap"><option value="1" '+(state.tahap===1?'selected':'')+'>Tahap 1 (Tahun 1–3)</option><option value="2" '+(state.tahap===2?'selected':'')+'>Tahap 2 (Tahun 4–5)</option><option value="0">Semua tahap (helaian berasingan)</option></select></div>'+
 '<div class="field"><label for="export-year">Tahun</label><select id="export-year"></select></div><p id="export-status" role="status" class="save-status">Penerima tidak dicampur antara Tahap 1 dan Tahap 2.</p></div>'+
 '<div class="dialog-actions"><button class="btn" id="export-download">↓ Muat turun laporan</button></div></form>';
 document.body.append(dialog);
 $('export-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 const fillYears=()=>{const tahap=+$('export-tahap').value,years=tahap===1?[1,2,3]:tahap===2?[4,5]:[1,2,3,4,5];$('export-year').innerHTML='<option value="0">Semua tahun pilihan</option>'+years.map(y=>'<option value="'+y+'">Tahun '+y+'</option>').join('');};
 $('export-tahap').onchange=fillYears;fillYears();
 $('export-form').onsubmit=async e=>{
  e.preventDefault();
  const btn=$('export-download'),status=$('export-status'),format=$('export-format').value,source=$('export-source').value,year=$('export-year').value,tahap=$('export-tahap').value;
  const suffix=tahap==='0'?'SemuaTahap':'Tahap'+tahap,part=year==='0'?'SemuaTahun':'Tahun'+year;
  btn.disabled=true;status.textContent='Menyediakan laporan…';
  try{
   const query='&source='+source+'&year='+year+'&tahap='+tahap;
   if(format==='csv'){
    const blob=await api('admin/export?format=csv'+query);
    saveReportBlob(blob,'MaPeM_SKPT_2026_'+suffix+'_'+part+'_'+source+'.csv');
   }else{
    const data=await api('admin/export?format=json'+query);
    const {buildReport}=await import('/export-report.js?v=26');
    const response=await fetch('/export-template.json?v=26');
    if(!response.ok)throw Error('Templat Excel tidak dapat dimuatkan.');
    const blob=buildReport(data,await response.json());
    saveReportBlob(blob,'MaPeM_SKPT_2026_'+suffix+'_'+part+'_'+source+'.xlsx');
   }
   status.textContent='Laporan berjaya disediakan untuk '+(tahap==='0'?'kedua-dua tahap':'Tahap '+tahap)+'.';
  }catch(err){status.textContent=err.message;}finally{btn.disabled=false;}
 };
 dialog.showModal();
}
function saveReportBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}

})();

