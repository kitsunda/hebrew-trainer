const CACHE_VERSION = 'hebrew-trainer-v8';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vocab.js',
  './lenya-vocab.js',
  './verb-families.js',
  './doc-imports.js',
  './transcriptions.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/achievement-flowers.png',
  './icons/launch-1125x2436.png',
  './icons/launch-1170x2532.png',
  './icons/launch-1179x2556.png',
  './icons/launch-1206x2622.png',
  './icons/launch-1242x2688.png',
  './icons/launch-1290x2796.png',
  './icons/launch-1320x2868.png'
];
const OPTIONAL_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event=>{
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(OPTIONAL_ASSETS.map(async url=>{
      const response = await fetch(url, {mode:'cors'});
      if(response.ok) await cache.put(url, response);
    }));
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
  if(url.origin===self.location.origin || url.hostname==='cdn.jsdelivr.net'){
    event.respondWith(cacheFirstAndRefresh(request));
  }
});
