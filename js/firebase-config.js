// Firebase 설정: 콘솔(프로젝트 설정 → 내 앱 → 웹 앱)에서 받은 값을 붙여 넣으면 로그인과 랭킹이 켜집니다.
// 비워 두면(null) 랭킹 없이 기기 안 기록만 씁니다. 자세한 순서는 README의 "랭킹 서버" 참고
window.FIREBASE_CONFIG = null;
/* 예시
window.FIREBASE_CONFIG = {
  apiKey: '...',
  authDomain: '내프로젝트.firebaseapp.com',
  projectId: '내프로젝트',
  appId: '...',
};
*/
