// 홈 화면 앱: 켤 때마다 새 파일을 먼저 받고(네트워크 우선), 안 되면 저장해 둔 걸로 켬 (오프라인)
// 그림·소리는 저장해 둔 걸 바로 쓰고 뒤에서 새로 받아 둠
const CACHE = 'chiikawa-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 폰트, 파이어베이스는 그대로
  const asset = url.pathname.includes('/assets/');
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (asset) {
      const hit = await cache.match(req);
      // 저장해 둔 그림을 바로 쓰고, 뒤에서 새 걸 받아 둠 (그림을 바꿔도 다음번엔 새 그림)
      if (hit) { e.waitUntil(fetch(req).then(res => res.ok && cache.put(req, res)).catch(() => {})); return hit; }
    }
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: !asset });
      if (hit) return hit;
      throw err;
    }
  })());
});
