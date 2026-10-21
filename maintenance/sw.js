// 점검 중: 예전 서비스 워커를 이 파일로 바꿔서 저장해 둔 게임을 지우고 스스로 꺼짐
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
