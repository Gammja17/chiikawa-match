// 클리어 자랑 카드: 모험 지도 스테이지를 깨면 결과 창에 '자랑하기' 버튼
// 그 지역 풍경 위에 로고, MVP 친구, 스테이지 이름·별·점수를 그린 그림(1080x1350)을 만들어 카톡·인스타 등으로 공유
// 아이폰 사파리는 버튼을 누른 그 순간에만 공유 창을 열 수 있어서, 결과 창이 뜰 때 그림을 미리 만들어 둠
const SHARE_URL = 'https://chiikawa.3match.workers.dev';
const Share = {
  blob: null, info: null, making: null,
  load: src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }),
  // o: { k 루트 번호, name, stars, mode 'b'|'l', char, line, rows: [[이름, 값]] }
  prepare(o) {
    Share.blob = null;
    Share.info = o;
    Share.making = Share.draw(o).then(b => (Share.info === o ? (Share.blob = b) : null)).catch(() => null);
    return Share.making;
  },
  async draw(o) {
    const W = 1080, H = 1350, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    await document.fonts?.load('80px "Poor Story"').catch(() => {});
    const [bg, logo, hero, star] = await Promise.all([
      Share.load(`assets/img/stage/s${regionOf(o.k) + 1}.jpg`), Share.load('assets/img/ui/logo.png'), Share.load(artOf(o.char)), Share.load(ITEM('star')),
    ]);
    // 배경: 지역 풍경을 꽉 채우고 아래쪽을 크림색으로 덮음
    g.fillStyle = '#fff4f8';
    g.fillRect(0, 0, W, H);
    if (bg) { const r = Math.max(W / bg.width, H / bg.height); g.drawImage(bg, (W - bg.width * r) / 2, 0, bg.width * r, bg.height * r); }
    const fade = g.createLinearGradient(0, 0, 0, H);
    fade.addColorStop(0, 'rgba(255,248,252,.05)');
    fade.addColorStop(0.5, 'rgba(255,248,252,.35)');
    fade.addColorStop(1, 'rgba(255,248,252,.92)');
    g.fillStyle = fade;
    g.fillRect(0, 0, W, H);
    const font = (px, w = '') => `${w} ${px}px "Poor Story", "Apple SD Gothic Neo", sans-serif`;
    const text = (s, x, y, px, color = '#4a4262', align = 'center', stroke = '#fff') => {
      g.font = font(px, 'bold');
      g.textAlign = align;
      g.lineJoin = 'round';
      g.lineWidth = px * 0.22;
      g.strokeStyle = stroke;
      g.strokeText(s, x, y);
      g.fillStyle = color;
      g.fillText(s, x, y);
    };
    // 로고
    if (logo) { const w = 620, h = (logo.height / logo.width) * w; g.drawImage(logo, (W - w) / 2, 40, w, h); }
    // MVP 친구 (아래 그림자 + 통통한 그림)
    if (hero) {
      const h = 520, w = (hero.width / hero.height) * h, x = (W - w) / 2, y = 400;
      g.fillStyle = 'rgba(74,66,98,.15)';
      g.beginPath(); g.ellipse(W / 2, y + h - 10, w * 0.38, 26, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(hero, x, y, w, h);
    }
    // 결과 도장
    g.save();
    g.translate(W - 210, 380);
    g.rotate(-0.2);
    g.fillStyle = '#ff5d7e';
    g.beginPath();
    if (g.roundRect) g.roundRect(-150, -62, 300, 124, 30); else g.rect(-150, -62, 300, 124);
    g.fill();
    g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
    text(o.mode === 'b' ? '토벌 성공!' : '클리어!', 0, 22, 64, '#fff', 'center', '#ff5d7e');
    g.restore();
    // 별
    for (let i = 0; i < 3; i++) {
      const x = W / 2 + (i - 1) * 150, y = 960, s = i === 1 ? 140 : 118;
      g.globalAlpha = i < o.stars ? 1 : 0.25;
      if (star) g.drawImage(star, x - s / 2, y - s / 2, s, s); else text('★', x, y + 40, s, '#ffcf3f');
    }
    g.globalAlpha = 1;
    // 스테이지 이름·장·결과
    const chap = [...CHAPTERS].reverse().find(([at]) => at <= o.k)?.[1] || '';
    text(`${o.k + 1} 스테이지 · ${chap}`, W / 2, 1090, 40, '#7a6f8f');
    text(o.name, W / 2, 1170, 78);
    const rows = (o.rows || []).map(([a, b]) => `${a} ${b}`).join('   ·   ');
    if (rows) text(rows, W / 2, 1235, 40, '#ff5d7e');
    g.font = font(30);
    g.textAlign = 'center';
    g.fillStyle = '#7a6f8f';
    g.fillText(`${SHARE_URL.replace('https://', '')}  ·  비공식 팬게임`, W / 2, 1310);
    return new Promise(ok => cv.toBlob(ok, 'image/png'));
  },
  // 결과 창 버튼에서 부름 (미리 만든 그림이 있으면 바로 공유 창)
  async go() {
    const o = Share.info;
    if (!o) return;
    const text = `먼작귀 퍼즐 토벌 대작전 ${o.k + 1}스테이지 '${o.name}'를 별 ${o.stars}개로 깼다! ${'★'.repeat(o.stars)}`;
    Stats.send('share', { method: 'clear_card', content_type: o.mode === 'b' ? 'battle' : 'puzzle', item_id: `stage_${o.k + 1}`, stage: o.k + 1 });
    const blob = Share.blob || (await Share.making);
    const file = blob && new File([blob], `chiikawa-stage${o.k + 1}.png`, { type: 'image/png' });
    try {
      if (file && navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text: `${text}\n${SHARE_URL}` });
      if (navigator.share) return await navigator.share({ title: '먼작귀 퍼즐 토벌 대작전', text, url: SHARE_URL });
    } catch (e) { if (e?.name === 'AbortError') return; } // 공유 창을 닫은 건 그냥 넘어감
    // 공유를 못 하는 브라우저(PC 등): 그림을 내려받고 주소를 복사
    if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `chiikawa-stage${o.k + 1}.png`; a.click(); }
    try { await navigator.clipboard.writeText(`${text}\n${SHARE_URL}`); banner('주소를 복사했어요!', 600); } catch {}
  },
};
