"""큰 PNG 묶음을 WebP로 바꿈 (모양은 그대로, 용량은 1/4 안팎). 처음 켤 때 받는 양을 줄이려고.

묶음마다 전부 바꿔서 코드에서 확장자 한 곳만 고치면 되게 함:
- assets/img/monsters/*  (data.js MONSTERS, index.html 미믹 보물창고)
- assets/img/combo/*     (game.js CIMG, style.css 피버 딱지)
- assets/img/ui/debuff_*, fx_*  (debuff.js DBF, style.css 잠든 친구)
- assets/img/gacha/machine.png  (index.html)
실행: python tools/to_webp.py   (이미 바꾼 건 건너뜀, 바꾼 PNG는 지움)
"""
import glob, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUPS = ['assets/img/monsters/*.png', 'assets/img/combo/*.png', 'assets/img/ui/debuff_*.png', 'assets/img/ui/fx_*.png', 'assets/img/gacha/machine.png']
before = after = 0
for pat in GROUPS:
    for f in sorted(glob.glob(os.path.join(ROOT, pat))):
        out = f[:-4] + '.webp'
        im = Image.open(f)
        im.save(out, 'WEBP', quality=88, method=6)
        a, b = os.path.getsize(f), os.path.getsize(out)
        before += a
        after += b
        os.remove(f)
print(f'{before // 1024}KB -> {after // 1024}KB')
