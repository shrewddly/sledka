const C='habits-v45',D='habits-data',UKEY='push-uid',LKEY='push-lang',SHELL=['./','index.html','privacy.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','fonts/lora-cyrillic-wght-normal.woff2','fonts/lora-latin-wght-normal.woff2','fonts/manrope-cyrillic-wght-normal.woff2','fonts/manrope-latin-wght-normal.woff2','fonts/nunito-cyrillic-wght-normal.woff2','fonts/nunito-latin-wght-normal.woff2','fonts/onest-cyrillic-wght-normal.woff2','fonts/onest-latin-wght-normal.woff2'];
const PROXY='https://api.sledka.ru',PROXY2='https://sledkasync.arlen-eupov.workers.dev';
const VAPID='BN0eSEdGKrchANnTWs6t8SWkqcmcKb0cZyRIgsW1vB1cc0ywjjSZ9pKYVdc85sj_0wghb4y2SFdd9OazeiaPJ88';
function b64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
function put(k,v){return caches.open(D).then(c=>c.put(k,new Response(String(v),{headers:{'Content-Type':'text/plain'}})));}
function get(k){return caches.open(D).then(c=>c.match(k)).then(r=>r?r.text():null);}

self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==D).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{
  const d=e.data||{};
  if(d.type==='set-uid')e.waitUntil(Promise.all([put(UKEY,d.uid||''),put(LKEY,d.lang||'')]));
  if(d.type==='clear-uid')e.waitUntil(caches.open(D).then(c=>c.delete(UKEY).then(()=>c.delete(LKEY))));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  if(u.searchParams.has('ping'))return;
  if(r.mode==='navigate'){
    e.respondWith((async()=>{
      const c=await caches.open(C);
      try{
        const x=await fetch(r);
        if(x&&x.ok)c.put(u.pathname==='/'||u.pathname==='/index.html'?'index.html':r,x.clone());
        return x;
      }catch(_){
        const hit=(await c.match(r))||(await c.match('index.html'));
        return hit||Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>{
    const f=fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x;}).catch(()=>m);
    return m||f;
  })));
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){var c=cs[i];if(c.url.indexOf(self.location.origin)===0)return c.focus();}
    return clients.openWindow(self.location.origin + '/');
  }));
});

function notify(t,b,tag,id){
  return self.registration.showNotification(t,{body:b||'',tag:tag,icon:'icon-192.png',badge:'icon-192.png',data:{id:id||''}});
}
function itemsFromPayload(d){
  if(!d)return null;
  if(Array.isArray(d.items)&&d.items.length)return d.items;
  if(d.title||d.body)return [{title:d.title||'Sledka',body:d.body||'',id:d.id||''}];
  return null;
}
function fetchItems(uid){
  return fetch(PROXY+'/rem?uid='+encodeURIComponent(uid),{cache:'no-store'}).catch(function(){return fetch(PROXY2+'/rem?uid='+encodeURIComponent(uid),{cache:'no-store'});}).then(function(r){return r.ok?r.json():null;})
    .then(function(j){return (j&&j.items)||[];}).catch(function(){return [];});
}

self.addEventListener('push',function(e){
  e.waitUntil((async function(){
    var d=null;try{d=e.data?e.data.json():null;}catch(_){}
    var items=itemsFromPayload(d);
    if(items){
      for(var i=0;i<items.length;i++)await notify(items[i].title||'Sledka',items[i].body,'sledka-'+(items[i].id||i),items[i].id||'');
      return;
    }
    var lang=(d&&d.lang)||await get(LKEY);
    var gen=lang==='en'?'Check your habits today':'Проверь привычки сегодня';
    var uid=(d&&d.uid)||'';
    if(!uid)uid=await get(UKEY);
    if(!uid)return notify('Sledka',gen,'sledka-daily','');
    var list=await fetchItems(uid);
    if(!list.length)return notify('Sledka',gen,'sledka-daily','');
    for(var k=0;k<list.length;k++)await notify(list[k].title||'Sledka',list[k].body,'sledka-'+(list[k].id||k),list[k].id||'');
  })());
});

self.addEventListener('pushsubscriptionchange',function(e){
  e.waitUntil((async function(){
    var sub=await self.registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)}).catch(function(){return null;});
    if(!sub)return;
    var cs=await clients.matchAll({type:'window'});
    cs.forEach(function(c){c.postMessage({type:'push-rotated'});});
  })());
});
