const CACHE='vespa-wahyu-v1.1.1';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './logo-garage-vespa.jpg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);

  // Never cache Supabase API/Auth/Storage responses.
  if(
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/')
  ) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put('./index.html',copy));
          return res;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit=>hit || fetch(req).then(res=>{
      if(res.ok && url.origin===self.location.origin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }))
  );
});
