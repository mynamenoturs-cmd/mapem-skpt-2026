// Pembantu AI + FAQ Pendaftaran Tahun 1 2027. Soalan umum dihantar kepada Workers AI.
// Jangan simpan teks perbualan; maklumat peribadi disekat dan dijawab melalui FAQ sahaja.
export const DEFAULT_TEACHERS=[
 {kelas:'Emerald',namaGuru:'Kamelia Nur Binti Raisin'},
 {kelas:'Ruby',namaGuru:'Airin Bin Alin'},
 {kelas:'Sapphire',namaGuru:'Ahmad Rifa’I Bin Syamsuddin'},
 {kelas:'Diamond',namaGuru:'Hayati Binti Abdul Rahim'},
 {kelas:'Jade',namaGuru:'Nur Ainun Arinah Binti Ramlee'},
 {kelas:'Crystal',namaGuru:'Nur Amalina Binti Mali'},
 {kelas:'Topaz',namaGuru:'Raisah Sandau'},
 {kelas:'Amber',namaGuru:'Mazniza Binti Mahadzir'},
 {kelas:'Pearl',namaGuru:'Nurul Umaierah Binti Abdul Rapi'}
];
export const QUICK_QUESTIONS=['Cara semak kelas anak','Senarai guru kelas','Dokumen diperlukan','Tarikh pendaftaran','Hubungi admin'];
const normal=x=>String(x??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('ms').replace(/[’‘]/g,"'").trim();
export function answerRegistrationQuestion(question,info={}){
 const q=normal(question);
 const teachers=Array.isArray(info.teachers)&&info.teachers.length?info.teachers:DEFAULT_TEACHERS;
 const phone=String(info.adminPhone||'').replace(/\D/g,'');
 const digits=phone.startsWith('0')?'60'+phone.slice(1):phone;
 const links=digits.length>=9&&digits.length<=15
 ?[{label:'WhatsApp admin',href:'https://wa.me/'+digits+'?text='+encodeURIComponent('Assalamualaikum, saya ingin bertanya mengenai pendaftaran Tahun 1 sesi 2027 SK Pekan Telipok.')},{label:'Telefon admin',href:'tel:+'+digits}]
 :[];
 const parent={label:'Paparan Ibu Bapa',href:'/ibu-bapa/'};
 if(!q)return {text:'Sila taip pertanyaan mengenai pendaftaran Tahun 1 2027.'};
 if(/\b\d{6}[- ]?\d{2}[- ]?\d{4}\b/.test(q)||/\b01\d[- ]?\d{7,8}\b/.test(q))
  return {text:'Jangan kongsi nombor MyKid, IC, telefon, alamat atau data peribadi murid melalui chat ini. Hubungi admin untuk urusan rekod.',links};
 if(/\b(hai|hi|hello|salam|assalamualaikum)\b/.test(q))
  return {text:'Waalaikumussalam! Saya Cikgu Wanwan BOT 🤖🌸, pembantu AI Pendaftaran Tahun 1 2027 SK Pekan Telipok. Boleh tanya tentang kelas, guru kelas, tarikh, dokumen atau cara menghubungi admin.'};
 const named=teachers.find(t=>normal(q).includes(normal(t.kelas)));
 if(named&&!/kelas\s+anak|kelas\s+murid|semak.*anak|nama\s+anak/.test(q))
  return {text:'Guru kelas 1 '+named.kelas+' ialah '+named.namaGuru+'.',links:[parent]};
 if(/guru|cikgu|teacher/.test(q))
  return {text:'Senarai guru kelas Tahun 1 sesi 2027:\n'+teachers.map(t=>'• 1 '+t.kelas+' — '+t.namaGuru).join('\n'),links:[parent]};
 if(/berapa\s+kelas|senarai\s+kelas|nama\s+kelas|semua\s+kelas|kelas\s+apa/.test(q))
  return {text:'Terdapat 9 kelas Tahun 1: '+teachers.map(t=>'1 '+t.kelas).join(', ')+'.',links:[parent]};
 if(/(semak|cari|lihat|check|status|penempatan)/.test(q)&&/(kelas|murid|anak|nama|pendaftaran|penempatan)/.test(q))
  return info.canSearchStudents===true
   ?{text:'Buka Paparan Ibu Bapa dan gunakan ruang “Semakan Kelas Anak”. Carian memaparkan nama dan kelas sahaja, bukan maklumat peribadi penjaga.',links:[parent]}
   :{text:'Semakan nama dan kelas anak belum dibuka oleh pentadbir sekolah. Sila hubungi pihak sekolah untuk pengesahan.',links:[parent,...links]};
 if(/dokumen|sijil\s+lahir|surat\s+beranak|mykid|mykad|fotostat|salinan|buku\s+kesihatan|syarat/.test(q))
  return {text:'Senarai dokumen dan syarat rasmi belum dinyatakan dalam portal. Sila sahkan dokumen dengan pihak sekolah. Jangan masukkan IC atau MyKid di ruang chat ini.',links};
 if(/tarikh|bila|hari|masa|pukul|waktu|tutup|mula|tempoh|deadline|jadual/.test(q))
  return {text:'Tarikh dan waktu urusan pendaftaran belum dinyatakan dalam portal. Sila rujuk pengumuman rasmi sekolah atau hubungi admin.',links};
 if(/hubungi|contact|whatsapp|wasap|telefon|call|nombor|admin|pejabat|bantuan/.test(q))
  return links.length?{text:'Hubungi admin pendaftaran melalui pilihan berikut:',links}:{text:'Nombor WhatsApp/telefon admin belum ditetapkan di portal. Sila hubungi pejabat SK Pekan Telipok, Tuaran, Sabah.'};
 if(/pra\b|prasekolah|pra\s+sekolah/.test(q))
  return {text:'PRA dalam sistem bermaksud murid pernah mengikuti prasekolah. Guru memilih Ya, Tidak atau Belum Pasti berdasarkan maklumat pendaftaran.'};
 if(/daftar|pendaftaran|mohon|isi\s+borang|register|cara\s+isi|baharu/.test(q))
  return {text:'Rekod murid dimasukkan oleh guru atau pentadbir yang diluluskan menggunakan log masuk Google. Ibu bapa boleh melihat maklumat kelas dalam Paparan Ibu Bapa dan menghubungi pihak sekolah untuk urusan pendaftaran.',links:[parent,...links]};
 if(/salah|betul|ubah|kemas\s+kini|edit|tersilap|pindah|bertukar/.test(q))
  return {text:'Paparan Ibu Bapa hanya untuk melihat. Jika maklumat anak perlu dibetulkan, hubungi pentadbir pendaftaran.',links};
 if(/gambar|foto|passport|pasport/.test(q))
  return {text:'Foto guru kelas akan dipaparkan apabila tersedia. Ibu bapa tidak perlu memuat naik gambar.',links:[parent]};
 return {text:'Saya belum mempunyai maklumat rasmi untuk soalan itu. Saya boleh bantu tentang kelas, guru kelas, cara semak kelas, pendaftaran dan hubungan admin.',links};
}
export function containsPrivateRegistrationDetails(question){
 const q=String(question||'');
 return /@|(?:\d[\s-]?){10,}|mykid|kad\s*pengenalan|alamat\s*(?:rumah|anak)|nama\s*anak|anak\s*saya|anak\s*aku|anak\s*saya\s*bernama/i.test(q)||
  /(?:kelas|semak|cari).{0,35}(?:anak saya|nama anak)|anak saya.{0,35}(?:nama|kelas)/i.test(q);
}
function boot(){
 if(document.getElementById('t1chat-launcher'))return;
 const root=document.createElement('div');root.className='t1chat-root';
 root.innerHTML=[
 '<button type="button" id="t1chat-launcher" class="t1chat-launcher" aria-label="Buka Cikgu Wanwan BOT" aria-expanded="false" aria-controls="t1chat-panel"><img class="t1chat-launcher-mascot" src="/assets/cikgu-wanwan-bot.gif" alt="" aria-hidden="true" width="48" height="64"><span class="t1chat-launcher-label">Cikgu Wanwan BOT</span></button>',
 '<section id="t1chat-panel" class="t1chat-panel" role="dialog" aria-label="Cikgu Wanwan BOT, pembantu AI pendaftaran Tahun 1" hidden>',
 '<header class="t1chat-header"><span class="t1chat-avatar"><img src="/assets/cikgu-wanwan-bot.gif" alt="Avatar Cikgu Wanwan BOT sedang melambai" width="56" height="78"></span><div><strong>Cikgu Wanwan BOT</strong><small>Pembantu AI · Pendaftaran Tahun 1 2027</small></div><button type="button" class="t1chat-close" aria-label="Tutup bot">×</button></header>',
 '<div class="t1chat-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>',
 '<div class="t1chat-quick" aria-label="Soalan lazim"></div>',
 '<form class="t1chat-form"><input type="text" maxlength="220" autocomplete="off" required placeholder="Taip pertanyaan..." aria-label="Taip soalan pendaftaran"><button type="submit" aria-label="Hantar soalan">➤</button></form>',
 '<p class="t1chat-privacy">AI Cloudflare + FAQ sandaran · Jangan taip IC, MyKid atau alamat murid.</p></section>'
 ].join('');
 document.body.append(root);
 const launcher=root.querySelector('#t1chat-launcher'),panel=root.querySelector('#t1chat-panel'),close=root.querySelector('.t1chat-close'),
  messages=root.querySelector('.t1chat-messages'),quick=root.querySelector('.t1chat-quick'),form=root.querySelector('form'),input=form.querySelector('input');
 let info={teachers:DEFAULT_TEACHERS,canSearchStudents:false,adminPhone:''},loaded=false;
 async function refresh(){
  if(loaded)return;
  try{
   const r=await fetch('/api/public/assistant',{cache:'no-store',credentials:'omit'});
   if(r.ok){const d=await r.json();if(Array.isArray(d.teachers)&&d.teachers.length===9)info={...info,...d};loaded=true;}
  }catch{/* Use safe offline defaults. */}
 }
 function add(text,user=false,links=[]){
  const el=document.createElement('div');el.className='t1chat-bubble '+(user?'t1chat-user':'t1chat-bot');
  const p=document.createElement('p');p.textContent=String(text);el.append(p);
  if(!user&&Array.isArray(links)){
   const row=document.createElement('div');row.className='t1chat-links';
   for(const link of links){
    const href=String(link?.href||'');
    if(!(href==='/ibu-bapa/'||/^https:\/\/wa\.me\/\d{9,15}(?:\?|$)/.test(href)||/^tel:\+\d{9,15}$/.test(href)))continue;
    const a=document.createElement('a');a.href=href;a.textContent=link.label||'Buka pautan';
    if(href.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}
    row.append(a);
   }if(row.childNodes.length)el.append(row);
  }
  messages.append(el);messages.scrollTop=messages.scrollHeight;
 }
 async function ask(question){
  const val=String(question||'').trim();if(!val)return;
  const fallback=answerRegistrationQuestion(val,info);
  if(containsPrivateRegistrationDetails(val)){
   add('Untuk keselamatan, maklumat berkaitan anak tidak dihantar kepada AI. '+fallback.text,false,fallback.links||[]);
   return;
  }
  add(val,true);
  const pending=document.createElement('div');
  pending.className='t1chat-bubble t1chat-bot';
  pending.textContent='Cikgu Wanwan BOT sedang fikir... ✨';
  messages.append(pending);messages.scrollTop=messages.scrollHeight;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const r=await fetch('/api/public/ai',{
    method:'POST',credentials:'omit',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({question:val}),signal:controller.signal
   });
   const data=r.ok?await r.json():{};
   if(data.mode==='ai'&&typeof data.text==='string'&&data.text.trim()){
    add(data.text.trim()+'\n\n— Jawapan AI berdasarkan maklumat sekolah',false,fallback.links||[]);
   }else{
    add(fallback.text+'\n\n— Jawapan FAQ automatik',false,fallback.links||[]);
   }
  }catch{
   add(fallback.text+'\n\n— Jawapan FAQ automatik',false,fallback.links||[]);
  }finally{clearTimeout(timeout);pending.remove();}
 }
 function openChat(open){
  panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));
  if(open){
   if(!messages.childNodes.length)add('Assalamualaikum! Saya Cikgu Wanwan BOT 🤖🌸. Seronok dapat membantu! Pilih soalan lazim di bawah atau tanya saya tentang pendaftaran Tahun 1 2027.');
   refresh();input.focus();
  }else launcher.focus();
 }
 launcher.addEventListener('click',()=>openChat(panel.hidden));
 close.addEventListener('click',()=>openChat(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden&&e.target.closest('.t1chat-root'))openChat(false);});
 for(const question of QUICK_QUESTIONS){
  const b=document.createElement('button');b.type='button';b.textContent=question;b.addEventListener('click',()=>ask(question));quick.append(b);
 }
 form.addEventListener('submit',e=>{e.preventDefault();const val=input.value;input.value='';ask(val);input.focus();});
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
