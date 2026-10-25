"""배포용 dist/ 폴더를 만듦 (Cloudflare Pages에 올릴 것).

- 게임에 필요한 파일만 복사: index.html, credits.html(출처 페이지), css/, js/, assets/
- 빼는 것: assets/raw (원본 다운로드), assets/king (유료 원본), 개발용 파일
- 유료 이펙트는 js/king-pack.js(뒤섞은 팩)로만 들어감. 없으면 무료 이펙트로 돌아감
실행: python tools/build_dist.py   →   npx wrangler deploy
"""
import os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SKIP_DIRS = {os.path.join('assets', 'raw'), os.path.join('assets', 'king')}

# 커밋 안 된 변경(다른 작업 중인 파일)이 섞여 배포되지 않게: 게임 파일에 변경이 있으면 멈춤
if '--dirty' not in sys.argv:
    st = subprocess.run(['git', 'status', '--porcelain', '--', 'index.html', 'css', 'js', 'assets'], cwd=ROOT, capture_output=True, text=True).stdout
    st = [l for l in st.splitlines() if 'js/king-pack.js' not in l]
    if st:
        sys.exit('커밋 안 된 변경이 있어서 멈췄어요 (일부러 그대로 올리려면 --dirty):\n' + '\n'.join(st))

if os.path.isdir(os.path.join(ROOT, 'assets', 'king')):
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'make_king_pack.py')], check=True)

if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)
for f in ('index.html', 'credits.html', 'manifest.webmanifest', 'sw.js'):  # 홈 화면 앱(PWA) 파일과 출처 페이지는 맨 위에
    shutil.copy2(os.path.join(ROOT, f), DIST)
for top in ('css', 'js', 'assets'):
    for dirpath, dirnames, files in os.walk(os.path.join(ROOT, top)):
        rel = os.path.relpath(dirpath, ROOT)
        dirnames[:] = [d for d in dirnames if os.path.join(rel, d) not in SKIP_DIRS]
        os.makedirs(os.path.join(DIST, rel), exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(dirpath, f), os.path.join(DIST, rel, f))
# 캐시: 코드는 짧게, 그림·소리는 길게
with open(os.path.join(DIST, '_headers'), 'w', encoding='utf-8') as f:
    f.write('/sw.js\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: public, max-age=300\n/css/*\n  Cache-Control: public, max-age=300\n/assets/*\n  Cache-Control: public, max-age=86400\n')
n = sum(len(fs) for _, _, fs in os.walk(DIST))
print(f'dist/ 준비 완료: 파일 {n}개 (유료 원본 PNG 0개)')
