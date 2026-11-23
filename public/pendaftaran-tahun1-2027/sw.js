/* SK Pekan Telipok Tahun 1 2027 — safe static-only service worker.
   NEVER cache API responses, auth endpoints, private data or non-GET requests. */
const VERSION='skpt-tahun1-pwa-v3';
const CACHE_PREFIX='skpt-tahun1-pwa-';
const ASSETS=[
  '/', '/ibu-bapa/', '/bot-admin/',
  '/manifest.webmanifest',
  '/pwa2027.mjs', '/pwa2027.css',
  '/import2027.mjs', '/bot2027.mjs', '/bot2027.css',
  '/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/assets/logo-sekolah-rasmi-2027.webp',
  '/assets/header-pendaftaran-2027-lima-pentadbir.avif'
];
const STATIC=new Set(ASSETS);
const isAllowed=(request,url)=>{
  if(request.method!=='GET'||url.origin!==self.location.origin)return false;
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/cdn-cgi/')||
     url.pathname.startsWith('/auth/')||url.pathname.startsWith('/registration2027/'))return false;
  if(request.headers.has('authorization')||request.headers.has('range'))return false;
  // Ignore query strings for asset identity, only cache paths approved above.
  return STATIC.has(url.pathname);
};
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.allSettled(ASSETS.map(async path=>{
      const response=await fetch(new Request(path,{cache:'reload'}));
      if(response.ok&&response.type!=='opaque')await cache.put(path,response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key.startsWith(CACHE_PREFIX)&&key!==VERSION)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(!isAllowed(request,url))return; // API always goes directly to network.
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{
      const response=await fetch(request);
      if(response.ok&&response.type!=='opaque')event.waitUntil(cache.put(url.pathname,response.clone()).catch(()=>{}));
      return response;
    }catch(error){
      const stored=await cache.match(url.pathname);
      if(stored)return stored;
      // No private data in fallback. Only the public app shell is eligible.
      if(request.mode==='navigate'){
        const home=await cache.match('/');
        if(home)return home;
      }
      throw error;
    }
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
