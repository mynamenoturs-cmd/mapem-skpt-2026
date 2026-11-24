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
export const DEFAULT_GREETING="Assalamualaikum dan salam sejahtera! 🌸 Saya Delima PTG BOT 🤖, pembantu maya Pendaftaran Tahun 1 Sesi 2027 SK Pekan Telipok. Saya sedia membantu ibu bapa dan penjaga mendapatkan maklumat tentang pendaftaran, guru kelas, semakan kelas anak dan cara menghubungi pihak sekolah. Pilih soalan di bawah atau taip pertanyaan anda. 😊";
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
 // Ucapan pembukaan sudah tertera. Balas salam ringkas tanpa mengulangi pengenalan.
 if(/^(?:assalamualaikum(?:\s+warahmatullahi\s+wabarakatuh)?)[!?.\s]*$/.test(q))
  return {text:'Waalaikumussalam! 😊 Ada apa yang boleh saya bantu tentang pendaftaran Tahun 1 2027?'};
 if(/^(?:hai|hi|hello|salam(?:\s+sejahtera)?)[!?.\s]*$/.test(q))
  return {text:'Hai! 😊 Ada apa yang boleh saya bantu tentang pendaftaran Tahun 1 2027?'};
 const custom=(Array.isArray(info.faqs)?info.faqs:[]).find(f=>f&&normal(f.question)===q&&typeof f.answer==='string'&&f.answer.trim());
 if(custom)return {text:custom.answer.trim(),links:[parent,...links],curated:true};
 if(/(?:sekolah|sk pekan).*(?:apa|mana|nama)|(?:nama|apa|mana).*(?:sekolah|sk pekan)/.test(q))return {text:'Ini portal Pendaftaran Tahun 1 2027 SK Pekan Telipok, Tuaran, Sabah.',known:true};
 if(/^(?:mana ai|ai mana|kau siapa|awak siapa|siapa (?:awak|kamu)|apa (?:fungsi|kelebihan) ai|bot ni apa)[?!. ]*$/.test(q))return {text:'Saya Delima PTG BOT, pembantu AI portal SK Pekan Telipok. Saya boleh membantu dengan panduan pendidikan, maklumat sekolah dan, selepas log masuk, statistik mengikut akses anda.',known:true};
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
// Route only clearly data-oriented questions into the verified aggregate tools.
const classNames=['Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl'];
const mentionedClass=q=>classNames.find(c=>new RegExp('\\b'+normal(c)+'\\b').test(normal(q)));
export function staffIntent(question){
 const q=normal(question);
 if(/^panduan umum\s*:/.test(q))return false;
 if(/^(buka|papar(?:kan)?|lihat)\b.*\b(senarai murid|kelas|rekod murid)\b/.test(q))return true;
 if(/\b(padam|delete|hapus|tukar|ubah|edit|pindah)\b.*\b(murid|rekod|kelas|data)\b/.test(q)&&!/\b(cara|macam mana|bagaimana|kenapa)\b/.test(q))return true;
 if(/rekod.*(?:belum lengkap|tidak lengkap|kosong)|(?:belum lengkap|tidak lengkap).*rekod|agihan kelas|statistik|demografi|(?:laporan|ringkasan).*(?:murid|pendaftaran|kelas)|kelas.*(?:paling ramai|paling sedikit|terbanyak|terendah)|(?:banding|seimbang).*kelas/.test(q))return true;
 if(/\b(berapa|brp|bapa|jumlah|bilangan|ramai|hitung|kira|total|count)\b/.test(q)&&(/\b(murid|pelajar|lelaki|perempuan|muslim|warganegara|pra|prasekolah|rekod|pendaftaran)\b/.test(q)||mentionedClass(q)))return true;
 return /^(?:dan\s+)?(?:murid\s+)?(?:lelaki|perempuan|muslim|bukan muslim|warganegara|bukan warganegara|pra|bukan pra)(?:\s+pula)?[?!. ]*$/.test(q);
}
export function staffQuestion(question,previous=''){
 const q=normal(question);
 if(staffIntent(question)){
  const old=mentionedClass(previous);
  return old&&!mentionedClass(question)&&/^(dan |pula |bagaimana dengan |kalau )|\bpula\b/.test(q)?question+' 1 '+old:question;
 }
 if(previous&&mentionedClass(question)&&/^(dan |pula |bagaimana dengan |kalau )|\bpula\b/.test(q)){
  const old=mentionedClass(previous);
  return (old?previous.replace(new RegExp('\\b'+old+'\\b','ig'),mentionedClass(question)):previous+' 1 '+mentionedClass(question));
 }
 return '';
}
export function privateStaffQuestion(question){
 const q=normal(question);
 return /\b(nama|alamat|telefon|email|e-mel|ic|mykid|id)\b.*\b(murid|pelajar|penjaga|ibu bapa|bapa|ibu)\b|\b(murid|pelajar|penjaga)\b.*\b(bernama|bin|binti|alamat|telefon|ic|mykid|email|e-mel)\b|\b(senarai|list|cari|semak)\b.*\b(nama murid|nama pelajar|individu|penjaga)\b/.test(q);
}
// Staff tools run locally on verified, aggregate-only server responses. No student data goes to public AI.
export function staffAnswer(question,summary){
 const q=normal(question), rows=Array.isArray(summary?.classes)?summary.classes:[];
 const all=['Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl'];
 const named=all.find(c=>new RegExp('\\b'+normal(c)+'\\b').test(q));
 const selected=named?rows.filter(r=>r.kelas===named):rows;
 if(!selected.length)return {text:'Kelas ini di luar skop akses anda atau tiada akses yang disahkan.'};
 const scope=named?'1 '+named:summary.role==='editor'?'1 '+summary.kelas:'Semua kelas dalam skop anda';
 const sum=k=>selected.reduce((n,r)=>n+Number(r[k]||0),0),total=sum('total');
 const result=text=>({text:scope+' · Statistik semasa\n'+text});
 if(/\b(padam|delete|hapus|tukar|ubah|edit|pindah|daftar)\b/.test(q)&&!/\b(laporan|statistik|berapa|jumlah|bilangan)\b/.test(q))return {text:'Saya tidak mengubah rekod melalui chat. Gunakan borang portal mengikut kebenaran anda.'};
 if(/^(buka|papar|lihat)\b.*(senarai|kelas|murid)/.test(q))return {text:'Gunakan butang di bawah untuk membuka '+(named?'kelas 1 '+named:'senarai murid')+'.',action:named?'class:'+named:'list'};
 if(/belum lengkap|tidak lengkap|kosong|tiada maklumat|rekod lengkap/.test(q))return result('Rekod belum lengkap: '+sum('belumLengkap')+' daripada '+total+' murid.\nPenjaga kosong: '+sum('tiadaPenjaga')+'; IC: '+sum('tiadaIc')+'; telefon: '+sum('tiadaTelefon')+'; alamat: '+sum('tiadaAlamat')+'; bangsa: '+sum('tiadaBangsa')+'.\nRekod mungkin mempunyai lebih daripada satu medan kosong. Semak senarai murid untuk butiran.');
 if(/paling ramai|paling sedikit|terbanyak|terendah|seimbang|banding|agihan kelas/.test(q)){
  if(selected.length<2)return result('Hanya satu kelas dalam skop semakan ini. Jumlah: '+total+' murid.');
  const sorted=[...selected].sort((a,b)=>b.total-a.total),max=sorted[0].total,min=sorted[sorted.length-1].total;
  return result('Agihan kelas:\n'+sorted.map(r=>'• 1 '+r.kelas+': '+r.total+' murid').join('\n')+'\nPerbezaan tertinggi dan terendah: '+(max-min)+' murid. Keseimbangan berdasarkan bilangan sahaja; faktor lain perlu semakan guru.');
 }
 if(/laporan|ringkasan|statistik|demografi|analisis/.test(q))return result('Jumlah murid: '+total+'\nLelaki: '+sum('lelaki')+' | Perempuan: '+sum('perempuan')+' | Belum diisi: '+(total-sum('lelaki')-sum('perempuan'))+'\nMuslim: '+sum('muslim')+' | Bukan Muslim: '+sum('bukanMuslim')+' | Belum diisi: '+(total-sum('muslim')-sum('bukanMuslim'))+'\nWarganegara: '+sum('warga')+' | Bukan warganegara: '+sum('bukanWarga')+' | Belum diisi: '+(total-sum('warga')-sum('bukanWarga'))+'\nPRA: '+sum('pra')+' | Bukan PRA: '+sum('bukanPra')+' | Belum pasti: '+(total-sum('pra')-sum('bukanPra'))+'\nRekod belum lengkap: '+sum('belumLengkap')+'\n'+selected.map(r=>'1 '+r.kelas+': '+r.total).join(' · '));
 if(/lelaki|perempuan|jantina/.test(q))return result('Lelaki: '+sum('lelaki')+' | Perempuan: '+sum('perempuan')+' | Belum diisi: '+(total-sum('lelaki')-sum('perempuan')));
 if(/muslim|agama|islam/.test(q))return result('Muslim: '+sum('muslim')+' | Bukan Muslim: '+sum('bukanMuslim')+' | Belum diisi: '+(total-sum('muslim')-sum('bukanMuslim')));
 if(/warga|citizen/.test(q))return result('Warganegara: '+sum('warga')+' | Bukan warganegara: '+sum('bukanWarga')+' | Belum diisi: '+(total-sum('warga')-sum('bukanWarga')));
 if(/\bpra\b|prasekolah/.test(q))return result('PRA: '+sum('pra')+' | Bukan PRA: '+sum('bukanPra')+' | Belum pasti: '+(total-sum('pra')-sum('bukanPra')));
 if(/jumlah|berapa|bilangan|ramai|kelas/.test(q))return result('Jumlah: '+total+' murid.\n'+selected.map(r=>'1 '+r.kelas+': '+r.total).join(' · '));
 return {text:'Saya belum dapat mengenal pasti analisis yang diminta. Contohnya, tanya jumlah murid atau statistik mengikut kelas.'};
}
function boot(){
 if(document.getElementById('t1chat-launcher'))return;
 const root=document.createElement('div');root.className='t1chat-root';
 root.innerHTML=[
 '<button type="button" id="t1chat-launcher" class="t1chat-launcher" aria-label="Buka Delima PTG BOT" aria-expanded="false" aria-controls="t1chat-panel"><img class="t1chat-launcher-mascot" src="/assets/cikgu-wanwan-bot-v2.gif" alt="" aria-hidden="true" width="48" height="64"><span class="t1chat-launcher-label">Delima PTG BOT</span></button>',
 '<section id="t1chat-panel" class="t1chat-panel" role="dialog" aria-label="Delima PTG BOT, pembantu AI pendaftaran Tahun 1" hidden>',
 '<header class="t1chat-header"><span class="t1chat-avatar"><img src="/assets/cikgu-wanwan-bot-v2.gif" alt="Avatar Delima PTG BOT sedang melambai" width="56" height="78"></span><div><strong>Delima PTG BOT</strong><small>Pembantu AI · Pendaftaran Tahun 1 2027</small></div><button type="button" class="t1chat-close" aria-label="Tutup bot">×</button></header>',
 '<div class="t1chat-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>',
 '<div class="t1chat-quick" aria-label="Soalan lazim"></div>',
 '<form class="t1chat-form"><input type="text" maxlength="220" autocomplete="off" required placeholder="Taip pertanyaan..." aria-label="Taip soalan pendaftaran"><button type="submit" aria-label="Hantar soalan">➤</button></form>',
 '<p class="t1chat-privacy">AI Cloudflare + FAQ sandaran · Jangan taip IC, MyKid atau alamat murid.</p></section>'
 ].join('');
 document.body.append(root);
 // A still image is a reliable fallback in Android embedded browsers that do not animate GIFs.
 root.querySelectorAll('.t1chat-launcher-mascot,.t1chat-avatar img').forEach(img=>{
  img.addEventListener('error',()=>{
   if(img.dataset.stillFallback)return;
   img.dataset.stillFallback='true';
   img.src='/assets/cikgu-wanwan-bot-v2-still.webp';
  });
 });

 const launcher=root.querySelector('#t1chat-launcher'),panel=root.querySelector('#t1chat-panel'),close=root.querySelector('.t1chat-close'),
  messages=root.querySelector('.t1chat-messages'),quick=root.querySelector('.t1chat-quick'),form=root.querySelector('form'),input=form.querySelector('input');
 let info={teachers:DEFAULT_TEACHERS,canSearchStudents:false,adminPhone:'',greeting:DEFAULT_GREETING,faqs:[]};
 let history=[],busy=false,epoch=0,staffLast='';
 const app=document.getElementById('app');
 const staffMode=()=>!!app&&!app.hidden;
 const privacy=root.querySelector('.t1chat-privacy');
 const title=root.querySelector('.t1chat-header small');
 function resetContext(){
  epoch++;history=[];staffLast='';messages.replaceChildren();
  if(!panel.hidden)add(staffMode()?'Saya boleh membantu dengan pertanyaan umum, maklumat sekolah dan statistik mengikut akses anda. Tanya seperti biasa.':' '+(info.greeting||DEFAULT_GREETING));
  if(title)title.textContent=staffMode()?'AI + Pembantu pengurusan':'Pembantu AI · Pendaftaran Tahun 1 2027';
  privacy.textContent=staffMode()?'AI + statistik terkawal · Jangan taip IC, MyKid atau alamat murid.':'AI + FAQ rasmi · Jangan taip IC, MyKid atau alamat murid.';
  renderQuickQuestions();
 }
 if(app)new MutationObserver(resetContext).observe(app,{attributes:true,attributeFilter:['hidden']});
 async function refresh(){
  try{
   const r=await fetch('/api/public/assistant',{cache:'no-store',credentials:'omit'});
   if(r.ok){const d=await r.json();if(Array.isArray(d.teachers)&&d.teachers.length===9)info={...info,...d};renderQuickQuestions();}
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
  const val=String(question||'').trim();if(!val||busy)return;
  const turn=epoch;
  const dataQuestion=staffMode()?staffQuestion(val,staffLast):'';
  if(staffMode()&&privateStaffQuestion(val)&&!dataQuestion){
   add('Untuk melindungi data murid, buka senarai murid melalui portal mengikut kebenaran anda. Jangan masukkan nama, IC atau butiran individu dalam chat.');return;
  }
  if(dataQuestion){
   busy=true;add(val,true);
   try{
    const r=await fetch('/api/registration2027/assistant-summary',{credentials:'same-origin',cache:'no-store'});
    if(turn!==epoch||!staffMode())return;
    if(!r.ok){add('Statistik memerlukan sesi Google yang sah dan kebenaran pendaftaran.');return;}
    const summary=await r.json();if(turn!==epoch||!staffMode())return;
    const answer=staffAnswer(dataQuestion,summary);staffLast=dataQuestion;
    add(answer.text,false);
    if(answer.action){const b=document.createElement('button');b.type='button';b.textContent='Buka paparan';b.className='btn btn-ghost';b.onclick=()=>{if(turn!==epoch||!staffMode())return;const target=answer.action==='list'?document.querySelector('#mainNav [data-view="list"]'):Array.from(document.querySelectorAll('[data-dashboard-class]')).find(x=>x.dataset.dashboardClass===answer.action.slice(6));if(target){target.click();openChat(false);}else add('Buka Dashboard dahulu untuk memilih kelas.');};messages.lastElementChild.append(b);}
   }catch{if(turn===epoch)add('Statistik tidak dapat dimuatkan. Sila cuba lagi.');}finally{busy=false;}
   return;
  }
  const fallback=answerRegistrationQuestion(val,info);
  if(staffMode())staffLast='';
  if(fallback.curated&&!containsPrivateRegistrationDetails(val)){add(val,true);add(fallback.text+'\n\n— Jawapan rasmi sekolah',false,fallback.links||[]);return;}
  if(containsPrivateRegistrationDetails(val)){
   add('Untuk keselamatan, pertanyaan yang mungkin mengandungi data individu tidak dihantar kepada AI. '+fallback.text,false,fallback.links||[]);
   return;
  }
  add(val,true);busy=true;
  const pending=document.createElement('div');
  pending.className='t1chat-bubble t1chat-bot';
  pending.textContent='Delima PTG BOT sedang fikir... ✨';
  messages.append(pending);messages.scrollTop=messages.scrollHeight;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  try{
   const r=await fetch('/api/public/ai',{
    method:'POST',credentials:'omit',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({question:val.replace(/^panduan umum\s*:/i,'').trim(),history}),signal:controller.signal
   });
   const data=r.ok?await r.json():{};
   if(turn!==epoch)return;
   if(data.mode==='ai'&&typeof data.text==='string'&&data.text.trim()){
    history=[...history,val].slice(-3);
    add(data.text.trim()+'\n\n— Pembantu AI',false,fallback.links||[]);
   }else{
    const reason=['quota','client-limit'].includes(data.reason)?'Kuota AI untuk hari ini telah dicapai.':'AI tidak tersedia buat masa ini.';
    add(fallback.text+'\n\n— Jawapan FAQ automatik · '+reason,false,fallback.links||[]);
   }
  }catch{
   if(turn===epoch)add(fallback.text+'\n\n— Jawapan FAQ automatik · Sambungan AI tidak berjaya.',false,fallback.links||[]);
  }finally{clearTimeout(timeout);pending.remove();busy=false;}
 }
 function openChat(open){
  panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));
  if(open){
   if(!messages.childNodes.length)add(staffMode()?'Saya boleh membantu dengan pertanyaan umum, maklumat sekolah dan statistik mengikut akses anda. Tanya seperti biasa.':info.greeting||DEFAULT_GREETING);
   refresh().then(()=>{
    if(!staffMode()&&messages.children.length===1){
     const first=messages.firstElementChild?.querySelector('p');
     if(first)first.textContent=info.greeting||DEFAULT_GREETING;
    }
   });
   input.focus();
  }else launcher.focus();
 }
 launcher.addEventListener('click',()=>openChat(panel.hidden));
 if(new URLSearchParams(location.search).get('buka-bot')==='1')openChat(true);
 close.addEventListener('click',()=>openChat(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden&&e.target.closest('.t1chat-root'))openChat(false);});
 function renderQuickQuestions(){
  quick.replaceChildren();
  const options=staffMode()?['Jumlah murid','Statistik demografi','Rekod belum lengkap','Agihan kelas','Buat laporan pendaftaran']:Array.isArray(info.faqs)&&info.faqs.length
   ?info.faqs.filter(f=>f&&f.question).slice(0,20).map(f=>f.question):QUICK_QUESTIONS;
  for(const question of options){
   const button=document.createElement('button');button.type='button';button.textContent=question;
   button.addEventListener('click',()=>ask(question));quick.append(button);
  }
 }
 renderQuickQuestions();
 form.addEventListener('submit',e=>{e.preventDefault();const val=input.value;input.value='';ask(val);input.focus();});
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
