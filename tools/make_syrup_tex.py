"""시럽·국물 무늬를 이음매 없이 만듦 (가로세로로 이어 붙여도 경계가 안 보임).

판 전체에 3칸 크기로 깔아서 칸마다 같은 무늬가 찍히지 않게 (css: .cellbg.syrup::after)
- 꿀(syrup_tex): 노란 꿀이 출렁이는 높낮이 → 위왼쪽 빛을 받은 윤기 + 작은 공기 방울
- 국물(broth_tex): 맑은 국물 + 동동 뜬 기름 방울
실행: python tools/make_syrup_tex.py   (numpy, Pillow)
"""
import os
import numpy as np
from PIL import Image

N = 480  # 3칸 크기 (칸 160px 기준)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img', 'obst')


def wrap_noise(rng, scale):
    """FFT로 흐리게 한 무작위 판: 주기 경계라 위아래·좌우가 그대로 이어짐"""
    f = np.fft.fft2(rng.standard_normal((N, N)))
    ky, kx = np.meshgrid(np.fft.fftfreq(N), np.fft.fftfreq(N), indexing='ij')
    f *= np.exp(-2 * np.pi ** 2 * scale ** 2 * (kx ** 2 + ky ** 2))  # scale: 흐리게 하는 폭(px)
    h = np.real(np.fft.ifft2(f))
    return (h - h.mean()) / h.std()


def shade(h, light=(-0.6, -0.8, 0.9), k=40.0):
    """높낮이 → 빛 받는 정도(반사광). k: 출렁임 세기. 기울기도 주기 경계로 (np.roll)"""
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    n = np.stack([-gx * k, -gy * k, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    l = np.array(light) / np.linalg.norm(light)
    diff = np.clip(n @ l, 0, 1)
    half = l + np.array([0, 0, 1.0])
    half /= np.linalg.norm(half)
    spec = np.clip(n @ half, 0, 1) ** 60
    return diff, spec


def blobs(img, rng, n, rmin, rmax, rim, fill, hi):
    """동그란 방울을 주기 경계로 (판 가장자리를 넘으면 반대쪽에서 이어짐)"""
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(n):
        cx, cy, r = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(rmin, rmax)
        dx = (xx - cx + N / 2) % N - N / 2
        dy = (yy - cy + N / 2) % N - N / 2
        d = np.sqrt(dx ** 2 + dy ** 2)
        a = np.clip((r - d) / 1.5, 0, 1)[..., None]                       # 방울 안
        edge = np.clip(1 - np.abs(d - r + 1.2) / 1.4, 0, 1)[..., None]     # 테두리
        spot = np.clip(1 - np.hypot(dx + r * 0.35, dy + r * 0.35) / (r * 0.35), 0, 1)[..., None]  # 위왼쪽 반짝
        img[:] = img * (1 - a) + (img * (1 - fill[1]) + np.array(fill[0]) * fill[1]) * a
        img[:] = img * (1 - edge * rim[1]) + np.array(rim[0]) * edge * rim[1]
        img[:] = img * (1 - spot * hi) + 255 * spot * hi


def save(img, name):
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + '.webp'), quality=88)
    print(name, 'saved')


rng = np.random.default_rng(17)
# 꿀
h = wrap_noise(rng, 46) + 0.25 * wrap_noise(rng, 18)
diff, spec = shade(h, k=34)
t = (h - h.min()) / (h.max() - h.min())
dark, light = np.array([255, 184, 60.0]), np.array([255, 222, 120.0])
img = dark + (light - dark) * (0.35 * t + 0.65 * diff)[..., None]
img += 255 * np.clip(spec * 0.75, 0, 0.6)[..., None]
blobs(img, rng, 14, 2.5, 6, rim=([214, 136, 30], 0.55), fill=([255, 236, 170], 0.35), hi=0.8)
save(img, 'syrup_tex')

# 국물
rng = np.random.default_rng(5)
h = wrap_noise(rng, 52) + 0.25 * wrap_noise(rng, 20)
diff, spec = shade(h, k=22)
t = (h - h.min()) / (h.max() - h.min())
dark, light = np.array([226, 182, 112.0]), np.array([246, 216, 160.0])
img = dark + (light - dark) * (0.4 * t + 0.6 * diff)[..., None]
img += 255 * np.clip(spec * 0.5, 0, 0.4)[..., None]
blobs(img, rng, 26, 3, 11, rim=([196, 140, 60], 0.6), fill=([255, 214, 120], 0.45), hi=0.7)  # 기름 방울
save(img, 'broth_tex')
