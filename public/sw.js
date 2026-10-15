// Cache only static shell. Never cache data from /api or auth redirects.
const CACHE='mapem-shell-v5';
const FILES=['/','/styles.css','/app.js','/manifest.webmanifest','/icon.svg','/brand.svg','/banner.svg','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/')));return;}
 if(FILES.includes(u.pathname)){event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));}
});
