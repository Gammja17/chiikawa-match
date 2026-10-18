"""배포용 dist/ 폴더를 만듦 (Cloudflare Pages에 올릴 것).

- 게임에 필요한 파일만 복사: index.html, css/, js/, assets/
- 빼는 것: assets/raw (원본 다운로드), assets/king (유료 원본), 개발용 파일
- 유료 이펙트는 js/king-pack.js(뒤섞은 팩)로만 들어감. 없으면 무료 이펙트로 돌아감
실행: python tools/build_dist.py   →   npx wrangler pages deploy dist --project-name chiikawa-match
"""
import os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SKIP_DIRS = {os.path.join('assets', 'raw'), os.path.join('assets', 'king')}

if os.path.isdir(os.path.join(ROOT, 'assets', 'king')):
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'make_king_pack.py')], check=True)

if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)
shutil.copy2(os.path.join(ROOT, 'index.html'), DIST)
for top in ('css', 'js', 'assets'):
    for dirpath, dirnames, files in os.walk(os.path.join(ROOT, top)):
        rel = os.path.relpath(dirpath, ROOT)
        dirnames[:] = [d for d in dirnames if os.path.join(rel, d) not in SKIP_DIRS]
        os.makedirs(os.path.join(DIST, rel), exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(dirpath, f), os.path.join(DIST, rel, f))
# 캐시: 코드는 짧게, 그림·소리는 길게
with open(os.path.join(DIST, '_headers'), 'w', encoding='utf-8') as f:
    f.write('/js/*\n  Cache-Control: public, max-age=300\n/css/*\n  Cache-Control: public, max-age=300\n/assets/*\n  Cache-Control: public, max-age=86400\n')
n = sum(len(fs) for _, _, fs in os.walk(DIST))
print(f'dist/ 준비 완료: 파일 {n}개 (유료 원본 PNG 0개)')
