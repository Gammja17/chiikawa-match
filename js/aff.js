// 호감도: 집에서 쓰다듬고(하루 한 번), 간식을 주고, 같이 모험을 다녀오면 오름
// Save.data.aff = { 친구id: 점수 }, Save.data.pat = { 친구id: 마지막으로 쓰다듬은 날 }
// 단계마다: 2 코인 / 3 짧은 이야기 / 4 뽑기 티켓 / 5 단짝 (공격·회복 +5%)
const AFF_AT = [0, 10, 30, 60, 100];
const AFF_FAV = { chiikawa: 'dango', hachiware: 'onigiri', usagi: 'parfait', momonga: 'parfait', kurimanju: 'dango', rakko: 'parfait', shisa: 'onigiri', kani: 'dango', goblin: 'onigiri' };
const AFF_STORY = {
  chiikawa: [['chiikawa', '(오늘도 같이 있어 줘서…)'], ['chiikawa', '…!! (헤헤…)'], ['hachiware', '오늘 엄청 좋아 보인다~']],
  hachiware: [['hachiware', '있잖아, 새 노래 만들었는데… 들어 줄래?'], ['hachiware', '흐흥~ ♪ 어때? 괜찮다는 거야!?'], ['chiikawa', '…!! (박수)']],
  usagi: [['usagi', '우라!'], ['usagi', '(간식을 반으로 뚝 나눠 내민다)'], ['usagi', '야하~!']],
  momonga: [['momonga', '나랑 제일 친한 거 맞지?'], ['momonga', '그럼 오늘도 칭찬해 줘! 많이!'], ['momonga', '에헤헤~ 착하지?']],
  kurimanju: [['kurimanju', '(안주를 슥 내민다)'], ['kurimanju', '……프하~'], ['kurimanju', '……(같이 먹자는 눈빛)']],
  rakko: [['rakko', '…요즘 많이 늘었어!! 좋아!'], ['rakko', '수련은 혼자보다 같이 하는 게 더 즐겁지.'], ['rakko', '…다음에도 같이 가자!']],
  shisa: [['shisa', '사부님이 국물 내는 법을 조금 알려 주셨어요!'], ['shisa', '제일 먼저 맛보여 드릴게요~!'], ['chiikawa', '…!! (꿀꺽)']],
  kani: [['kani', '(오늘 고른 책을 살며시 내민다)'], ['kani', '(책갈피를 하나 더 끼워 주고 꾸벅)']],
};
const Aff = {
  pts: id => (Save.data.aff || {})[id] || 0,
  lv: id => AFF_AT.filter(n => Aff.pts(id) >= n).length,
  // 다음 단계까지 얼마나 찼는지 (0~1)
  frac(id) {
    const lv = Aff.lv(id);
    if (lv >= AFF_AT.length) return 1;
    return (Aff.pts(id) - AFF_AT[lv - 1]) / (AFF_AT[lv] - AFF_AT[lv - 1]);
  },
  async add(id, n, from = null) {
    if (!Meta.owned(id) || n <= 0) return;
    const d = Save.data, before = Aff.lv(id);
    d.aff = d.aff || {};
    d.aff[id] = Math.min(AFF_AT[AFF_AT.length - 1], (d.aff[id] || 0) + n);
    Save.save();
    if (from) for (let k = 0; k < Math.min(5, 1 + Math.floor(n / 3)); k++) setTimeout(() => floatNum(from.x + (Math.random() - 0.5) * 40, from.y - 20, '♥', '#ff6b8a'), k * 120);
    if ($('#house').classList.contains('active')) Aff.bar(homeOf);
    if (Aff.lv(id) > before) await Aff.levelUp(id, Aff.lv(id));
  },
  async levelUp(id, lv) {
    const ch = CHARS[charIdx(id)];
    Sound.play('jingle_win', 1.2, 0.7);
    confetti(12);
    let reward = '';
    if (lv === 2) { Meta.addCoins(100); reward = '코인 100'; }
    if (lv === 3) reward = '이야기';
    if (lv === 4) { Save.data.tickets = (Save.data.tickets || 0) + 1; reward = '뽑기 티켓 1장'; }
    if (lv === 5) reward = '단짝! 공격·회복 +5%';
    Save.save();
    await new Promise(done => modal({ title: `호감도 ${lv}단계!`, char: id, text: `${ch.name}: "${lineOf(id)}"`, rows: [['호감도', '♥'.repeat(lv)], ['보상', reward]], btn1: '좋아!', on1: done }));
    if (lv === 3) await playStory(AFF_STORY[id] || [[id, lineOf(id)], ['chiikawa', '…!! (헤헤)']]);
  },
  // 하루 한 번 쓰다듬기
  pat(id, el) {
    const d = Save.data;
    d.pat = d.pat || {};
    if (d.pat[id] === today()) return;
    d.pat[id] = today();
    const r = el.getBoundingClientRect(), a = app.getBoundingClientRect();
    Aff.add(id, 2, { x: r.left - a.left + r.width / 2, y: r.top - a.top });
    Daily.add('pat');
  },
  // 집 위쪽: 하트 단계와 다음 단계까지 막대
  bar(id) {
    const ch = CHARS[charIdx(id)], lv = Aff.lv(id), fav = AFF_FAV[id];
    $('#affBar').innerHTML = `<span class="hearts5">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= lv ? 'on' : ''}">♥</i>`).join('')}</span>
      <span class="abar"><i style="width:${Aff.frac(id) * 100}%"></i></span>${fav ? `<small>좋아하는 간식 <img src="${ITEM(fav)}"></small>` : ''}`;
    $('#affBar').style.setProperty('--ring', ch.ring);
  },
  // 간식 주기: 가진 간식 중 하나를 골라서 집주인에게 (좋아하는 간식이면 두 배)
  feed(id) {
    const own = Object.keys(TREATS).filter(t => (Save.data.treats[t] || 0) > 0);
    const card = $('#charSheet .sheet-card'), ch = CHARS[charIdx(id)];
    card.style.setProperty('--ring', ch.ring);
    card.innerHTML = `<div class="mates-title">${ch.name}에게 간식 주기</div>
      <div class="feed-grid">${Object.keys(TREATS).map(t => `<button data-t="${t}" ${(Save.data.treats[t] || 0) > 0 ? '' : 'disabled'}><img src="${ITEM(t)}"><b>${TREATS[t]}</b><small>${Save.data.treats[t] || 0}개${AFF_FAV[id] === t ? ' · 좋아해요!' : ''}</small></button>`).join('')}</div>
      ${own.length ? '' : '<p class="feed-none">간식은 스테이지를 깨면 받아요</p>'}
      <div class="sheet-btns"><button class="big-btn ghost" data-close>닫기</button></div>`;
    card.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => {
      const t = b.dataset.t;
      if (!(Save.data.treats[t] > 0)) return;
      Save.data.treats[t]--;
      Save.save();
      $('#charSheet').classList.remove('show');
      // 간식이 친구 쪽으로 톡 날아가서 냠
      const res = $('#room .resident.owner'), r = res.getBoundingClientRect(), a = app.getBoundingClientRect();
      const to = { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height * 0.45 };
      const im = new Image();
      im.src = ITEM(t);
      im.className = 'fximg';
      Object.assign(im.style, { left: a.width / 2 + 'px', top: a.height - 160 + 'px', width: '54px' });
      fx.appendChild(im);
      im.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(calc(-50% + ${(to.x - a.width / 2) / 2}px), calc(-50% + ${(to.y - a.height + 160) / 2 - 80}px)) scale(1.2)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${to.x - a.width / 2}px), calc(-50% + ${to.y - a.height + 160}px)) scale(.3)`, opacity: 0.4 }], { duration: 520, easing: 'ease-in-out' }).finished.then(() => {
        im.remove();
        Sound.play('heal', 1.3, 0.8);
        res.querySelector('.fig')?.animate([{ transform: 'scale(1.15, .85)' }, { transform: 'scale(.92, 1.08)' }, { transform: 'none' }], { duration: 360 });
        const rs = res.querySelector('.rsay');
        if (rs) { rs.textContent = AFF_FAV[id] === t ? '…!! (최고야…!)' : lineOf(id); rs.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1600 }); }
        Aff.add(id, AFF_FAV[id] === t ? 10 : 5, to);
      });
    }));
    card.querySelector('[data-close]').onclick = () => { Sound.play('click'); $('#charSheet').classList.remove('show'); };
    $('#charSheet').classList.add('show');
    fitText($('#charSheet'));
  },
  // 같이 모험을 이기면 데려간 친구들 +1
  afterWin(ids) { [...new Set(ids)].forEach(id => Aff.add(id, 1)); },
};
$('#btnFeed').onclick = () => { Sound.play('click'); Aff.feed(homeOf); };
// 단짝(5단계)이면 공격·회복 +5%
const affBase = Meta.mult;
Meta.mult = id => affBase(id) * (Aff.lv(id) >= 5 ? 1.05 : 1);
