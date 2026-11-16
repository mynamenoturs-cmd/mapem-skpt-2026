/* Pendaftaran Tahun 1 2027: installable Android/iOS PWA.
   Never reads or stores student information, credentials or chat content. */
let deferredInstallPrompt=null;
const isStandalone=()=>Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true);
const appleDevice=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const androidDevice=()=>/Android/i.test(navigator.userAgent);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
window.addEventListener('appinstalled',()=>{
 deferredInstallPrompt=null;
 document.querySelectorAll('[data-pwa-install]').forEach(btn=>btn.hidden=true);
 document.querySelector('.pwa-install-dialog')?.remove();
});
function guide(){
 if(appleDevice())return {
  title:'Pasang pada iPhone / iPad',
  body:'<ol><li>Buka portal menggunakan <strong>Safari</strong>.</li>'+
   '<li>Tekan ikon <strong>Share / Kongsi</strong> pada Safari.</li>'+
   '<li>Pilih <strong>Add to Home Screen / Tambah ke Skrin Utama</strong>.</li>'+
   '<li>Jika dipaparkan, hidupkan <strong>Open as Web App</strong>, kemudian tekan <strong>Add</strong>.</li></ol>'+
   '<p>Ikon rasmi SK Pekan Telipok akan muncul pada skrin utama.</p>'
 };
 if(androidDevice())return {
  title:'Pasang pada Android',
  body:'<ol><li>Buka portal ini dalam <strong>Google Chrome</strong> (bukan pelayar dalam WhatsApp atau Facebook).</li>'+
   '<li>Tekan menu <strong>⋮</strong> Chrome.</li>'+
   '<li>Pilih <strong>Install app / Pasang aplikasi</strong> atau <strong>Add to Home screen</strong>.</li>'+
   '<li>Tekan <strong>Install / Pasang</strong> untuk menyelesaikan pemasangan.</li></ol>'
 };
 return {
  title:'Pasang Portal SKPT',
  body:'<ol><li>Android: buka Chrome dan pilih <strong>Install app</strong> pada menu ⋮.</li>'+
   '<li>iPhone: buka Safari, tekan <strong>Share</strong>, kemudian pilih <strong>Add to Home Screen</strong>.</li></ol>'
 };
}
function instructions(){
 document.querySelector('.pwa-install-dialog')?.remove();
 const data=guide();
 const wrap=document.createElement('div');
 wrap.className='pwa-install-dialog';
 wrap.innerHTML='<section class="pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">'+
  '<div class="pwa-install-head"><img src="/icons/icon-192.png" width="55" height="55" alt="Ikon aplikasi SK Pekan Telipok">'+
  '<div><strong id="pwaInstallTitle"></strong><small>Portal Pendaftaran Tahun 1 2027</small></div>'+
  '<button type="button" class="pwa-install-close" aria-label="Tutup panduan pemasangan">×</button></div>'+
  '<div class="pwa-install-body">'+data.body+
  '<p class="pwa-install-help">Pemasangan ini tidak memerlukan APK atau App Store. Log masuk Google, data Cloudflare dan AI masih memerlukan internet.</p></div>'+
  '<button type="button" class="pwa-install-done">Faham</button></section>';
 wrap.querySelector('#pwaInstallTitle').textContent=data.title;
 document.body.append(wrap);
 const onKey=e=>{if(e.key==='Escape')close();};
 const close=()=>{wrap.remove();document.removeEventListener('keydown',onKey);};
 document.addEventListener('keydown',onKey);
 wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('.pwa-install-close,.pwa-install-done'))close();});
 wrap.querySelector('.pwa-install-close').focus();
}
async function installApp(){
 if(isStandalone())return;
 if(deferredInstallPrompt){
  const prompt=deferredInstallPrompt;deferredInstallPrompt=null;
  try{
   await prompt.prompt();
   const choice=await prompt.userChoice;
   if(choice?.outcome==='accepted')return;
  }catch{/* Manual guide is available on all browsers. */}
 }
 instructions();
}
function installButton(type){
 const b=document.createElement('button');
 b.type='button';b.dataset.pwaInstall='';
 b.className='pwa-install-action pwa-install-'+type;
 b.textContent='⬇ Pasang Aplikasi';
 b.title='Pasang portal Tahun 1 2027 pada Android atau iPhone';
 b.addEventListener('click',installApp);
 return b;
}
function mount(){
 if(isStandalone())return;
 const login=document.querySelector('.cloud-login');
 if(login)login.append(installButton('login'));
 const header=document.querySelector('#app .brand-actions');
 if(header)header.append(installButton('header'));
 const parent=document.querySelector('main.top');
 if(parent){
  const row=document.createElement('div');row.className='pwa-install-parent-row';
  row.append(installButton('parent'));
  parent.prepend(row);
 }
 const admin=document.querySelector('#editor');
 const back=document.querySelector('a.back');
 if(admin&&back)back.after(installButton('admin'));
}
if('serviceWorker' in navigator && window.isSecureContext){
 navigator.serviceWorker.register('/sw.js',{scope:'/'})
  .catch(()=>{/* The website remains available without PWA support. */});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
