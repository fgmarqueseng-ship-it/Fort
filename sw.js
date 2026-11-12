// Service worker simples: permite instalar o Fort e abre a última versão quando há internet.
const CACHE='fort-v17';
const ASSETS=['./','index.html','style.css?v=17','config.js?v=17','core.js?v=17','fort.js?v=17','fort2.js?v=17','boot.js?v=17','manifest.json','icons/icon-192.png','vendor/supabase.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});

// Notificações de vencimento
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'Fort',body:e.data?e.data.text():''}}
 e.waitUntil(self.registration.showNotification(d.title||'Fort',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'fort-venc',renotify:true,data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL(e.notification.data&&e.notification.data.url||'./',self.registration.scope).href;
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if(w.url.startsWith(self.registration.scope)){w.focus();w.navigate(url);return}}return clients.openWindow(url)}))});
