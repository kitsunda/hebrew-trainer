const CACHE_VERSION = 'hebrew-trainer-v11';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './bootstrap.js',
  './app.js',
  './manifest.webmanifest',
  './vendor/supabase-2.110.8.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event=>{
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache = await caches.open(CACHE_VERSION);
  try{
    const response = await fetch(request);
    if(response.ok) await cache.put(request, response.clone());
    return response;
  }catch(error){
    return (await cache.match(request)) || (await cache.match('./index.html'));
  }
}

async function cacheFirstAndRefresh(request){
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(response=>{
    if(response.ok) cache.put(request, response.clone());
    return response;
  }).catch(()=>null);
  return cached || (await refresh) || Response.error();
}

self.addEventListener('fetch', event=>{
  const request = event.request;
  if(request.method!=='GET') return;
  const url = new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(cacheFirstAndRefresh(request));
  }
});

self.addEventListener('message', event=>{
  if(event.data?.type!=='CACHE_URLS' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE_VERSION);
    await Promise.allSettled(event.data.urls.map(async path=>{
      const url = new URL(path,self.registration.scope).href;
      const response = await fetch(url);
      if(response.ok) await cache.put(url,response);
    }));
  })());
});
