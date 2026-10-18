"""유료 이펙트(assets/king/*.png)를 배포용 팩(js/king-pack.js)으로 만듦.

- 원본 PNG는 배포하지 않음: 192px로 줄이고 모양(투명도)만 남김
- 한 덩어리로 압축한 뒤 간단히 뒤섞어 JS 안에 넣음 (사이트에 .png 주소가 없음)
- 게임(js/game.js)이 켜질 때 풀어서 메모리 안에서만 씀
assets/king 과 js/king-pack.js 는 .gitignore 되어 저장소에 올라가지 않음.
실행: python tools/make_king_pack.py
"""
import base64, json, os, random, sys, zlib
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'king')
OUT = os.path.join(ROOT, 'js', 'king-pack.js')
W = 192

names = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith('.png'))
if not names:
    sys.exit('assets/king 이 비어 있어요')
raw = bytearray()
for n in names:
    im = Image.open(os.path.join(SRC, n + '.png')).convert('RGBA')
    im.thumbnail((W, W), Image.LANCZOS)
    sq = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    sq.paste(im, ((W - im.width) // 2, (W - im.height) // 2))
    raw += sq.getchannel('A').tobytes()

data = bytearray(zlib.compress(bytes(raw), 9))
key = random.randrange(1, 2**31)
s = key
for i in range(len(data)):
    s = (s * 1103515245 + 12345) & 0xFFFFFFFF
    data[i] ^= s >> 24
pack = {'w': W, 'n': names, 'k': key, 'd': base64.b64encode(bytes(data)).decode()}
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('// 자동 생성 (tools/make_king_pack.py). 저장소에 올리지 않음\nwindow.KING_PACK=' + json.dumps(pack, separators=(',', ':')) + ';\n')
print(f'{len(names)}개 → {OUT} ({os.path.getsize(OUT) // 1024} KB)')
