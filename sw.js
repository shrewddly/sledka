const C='habits-v21',D='habits-data',SHELL=['./','index.html','privacy.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','fonts/lora-cyrillic-wght-normal.woff2','fonts/lora-latin-wght-normal.woff2','fonts/manrope-cyrillic-wght-normal.woff2','fonts/manrope-latin-wght-normal.woff2','fonts/nunito-cyrillic-wght-normal.woff2','fonts/nunito-latin-wght-normal.woff2','fonts/onest-cyrillic-wght-normal.woff2','fonts/onest-latin-wght-normal.woff2'];
const EXT=['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==D).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||!(u.origin===location.origin||EXT.includes(u.hostname)))return;
  if(u.searchParams.has('ping'))return;
  if(r.mode==='navigate'){
    e.respondWith((async()=>{
      const c=await caches.open(C);
      const net=fetch(r).then(x=>{c.put(r,x.clone());return x;});
      e.waitUntil(net.catch(()=>{}));
      const hit=(await c.match(r))||(await c.match('index.html'));
      if(!hit)return net.catch(()=>Response.error());
      return Promise.race([net,new Promise(res=>setTimeout(()=>res(hit),2500))]).catch(()=>hit);
    })());
    return;
  }
  e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>{
    const f=fetch(r).then(x=>{if(x.ok||x.type==='opaque')c.put(r,x.clone());return x;}).catch(()=>m);
    return m||f;
  })));
});
