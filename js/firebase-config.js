// Firebase 설정: 콘솔(프로젝트 설정 → 내 앱 → 웹 앱)에서 받은 값. 웹 키는 공개용이라 올려도 됨 (보안은 firestore.rules와 허용 도메인이 지킴)
// 비워 두면(null) 랭킹 없이 기기 안 기록만 씁니다. 자세한 순서는 README의 "랭킹 서버" 참고
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAgReZPCDmQ8QtP_-5y7_uedihRHfiMqgY',
  authDomain: 'chiikawa-3match.firebaseapp.com',
  projectId: 'chiikawa-3match',
  appId: '1:501917315755:web:10cea2c6ffbd052aaefdee',
  measurementId: 'G-4MTFF29V0K', // Google Analytics (방문자 수·이용 시간)
};

// 내 PC·같은 와이파이에서 띄운 테스트 서버(localhost, 192.168.x 등)에서는 실제 랭킹·저장 DB에 붙지 않음
// (테스트 판 기록·게스트 계정이 진짜 랭킹에 섞이는 것 막기). 꼭 붙여서 시험해야 하면 주소 끝에 ?net
(() => {
  const h = location.hostname;
  const local = location.protocol === 'file:' || !h || h === 'localhost' || h === '[::1]' || h.endsWith('.localhost') || h.endsWith('.test')
    || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
  if (local && !/[?&]net(=|&|$)/.test(location.search)) { window.FIREBASE_CONFIG = null; console.info('[net] 로컬 테스트: 실제 DB에 연결 안 함 (붙이려면 ?net)'); }
})();
