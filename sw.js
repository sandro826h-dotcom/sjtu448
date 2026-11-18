/* 离线缓存：首次打开后，全部文件存进浏览器，没网也能用；发布新版本时 VERSION 变化，旧缓存自动清掉。 */
var VERSION='448-v0.7-bfb4f97e';
var FILES=["./", "index.html", "app.js", "manifest.json", "icon-192.png", "icon-512.png", "data/b01.js", "data/b02.js", "data/b03.js", "data/b04.js", "data/b05.js", "data/b06.js", "data/b07.js", "data/b08.js", "data/b09.js", "data/b10.js", "data/b11.js", "data/b12.js", "data/b13.js", "data/b14.js", "data/b15.js", "data/meta.js"];
self.addEventListener('install',function(e){e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(VERSION).then(function(c){c.put(e.request,cp)});return r}).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));
});
