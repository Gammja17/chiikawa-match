// Firebase 설정: 콘솔(프로젝트 설정 → 내 앱 → 웹 앱)에서 받은 값. 웹 키는 공개용이라 올려도 됨 (보안은 firestore.rules와 허용 도메인이 지킴)
// 비워 두면(null) 랭킹 없이 기기 안 기록만 씁니다. 자세한 순서는 README의 "랭킹 서버" 참고
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAgReZPCDmQ8QtP_-5y7_uedihRHfiMqgY',
  authDomain: 'chiikawa-3match.firebaseapp.com',
  projectId: 'chiikawa-3match',
  appId: '1:501917315755:web:10cea2c6ffbd052aaefdee',
};
