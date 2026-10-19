// 괴물 특수 공격과 디버프: 종류마다 하나씩, 공격할 때 한 번 걸러 한 번(1·3·5번째) 같이 씀. 너무 어렵지 않게 약하고 짧게
// 잠재우기(친구 하나 2턴: 공격 반, 게이지 안 참) · 독(3턴 동안 매 턴 조금씩, 체력 1은 남김) · 어둠(2턴 공격 -30%)
// 수수께끼(친구 하나 게이지 반) · 거품 뿜기(구슬 2개가 거품) · 쿵쿵(판 섞기) · 회복(괴물 체력 15%)
const MON_SKILL = {
  anoko: 'sleep', siren: 'sleep', dekatsuyo: 'poison', blackstar: 'weak', sphinx: 'drain', ode: 'bubble', elephant: 'stomp', mermaid: 'heal',
};
const DEBUFF_INFO = {
  sleep: { name: '잠', img: 'debuff_sleep' }, poison: { name: '독', img: 'debuff_poison' }, weak: { name: '어둠', img: 'debuff_weak' },
};
const DBF = n => `assets/img/ui/${n}.png`;
['debuff_sleep', 'debuff_poison', 'debuff_weak', 'debuff_drain', 'fx_sleep', 'fx_poison', 'fx_dark', 'fx_dust'].forEach(n => (new Image().src = DBF(n)));

const Debuff = {
  s: { sleep: {}, poison: 0, poisonDmg: 0, weak: 0 },
  reset() {
    Debuff.s = { sleep: {}, poison: 0, poisonDmg: 0, weak: 0 };
    Debuff.render();
  },
  asleep: k => B.mode === 'battle' && (Debuff.s.sleep[k] || 0) > 0,
  // 어둠이 걸리면 공격이 약해짐
  weaken: dmg => (B.mode === 'battle' && Debuff.s.weak > 0 ? Math.max(1, Math.round(dmg * 0.7)) : dmg),
  // 내 턴이 끝날 때: 독이 한 번 들고, 남은 턴이 하나씩 줄어듦
  async tick() {
    const s = Debuff.s;
    if (s.poison > 0) {
      const d = Math.min(s.poisonDmg, B.teamHp - 1); // 독으로는 쓰러지지 않음
      if (d > 0) {
        B.teamHp -= d;
        updateTeam();
        const c = centerOf($('#teamHp'));
        floatNum(c.x, c.y - 10, `-${d}`, '#9b5bd6');
        $('#teamHp').animate([{ filter: 'hue-rotate(0)' }, { filter: 'hue-rotate(90deg) brightness(1.2)' }, { filter: 'none' }], { duration: 360 });
        Sound.play('bad', 1.3, 0.4);
        await sleep(250);
      }
      s.poison--;
    }
    if (s.weak > 0) s.weak--;
    Object.keys(s.sleep).forEach(k => { if (--s.sleep[k] <= 0) delete s.sleep[k]; });
    Debuff.render();
  },
  // 괴물이 공격한 뒤 특수 공격 (종류마다, 한 번 걸러 한 번)
  async special(mon) {
    const kind = MON_SKILL[mon.w.m];
    mon.atkN = (mon.atkN || 0) + 1;
    if (!kind || mon.atkN % 2 === 0 || B.teamHp <= 0) return;
    const from = centerOf(mon.el.img), s = Debuff.s;
    if (kind === 'sleep') {
      const ks = B.team.slice(0, B.real).map((_, k) => k).filter(k => !Debuff.asleep(k) && !teamCh(k).heal);
      if (!ks.length) return;
      const k = ks[Math.floor(Math.random() * ks.length)], el = $('#party').children[k];
      await Debuff.fly('fx_sleep', from, centerOf(el), 1.6);
      s.sleep[k] = 2;
      Debuff.say(el, `${teamCh(k).name} 쿨쿨…`, '#7a8cff');
      Sound.play('pop', 0.6, 0.6);
    } else if (kind === 'poison') {
      await Debuff.fly('fx_poison', from, centerOf($('#teamHp')), 1.5);
      s.poison = 3;
      s.poisonDmg = Math.max(4, Math.round(mon.w.atk * 0.25));
      Debuff.say($('#teamHp'), '독! 3턴 동안 조금씩', '#9b5bd6');
    } else if (kind === 'weak') {
      Debuff.cloud('fx_dark');
      s.weak = 2;
      Debuff.say($('#party'), '어둠! 2턴 동안 공격이 약해져', '#6a5a96');
    } else if (kind === 'drain') {
      const k = B.team.slice(0, B.real).map((_, j) => j).sort((a, b) => B.gauge[b] - B.gauge[a])[0];
      if (k == null || !B.gauge[k]) return;
      const el = $('#party').children[k];
      await Debuff.fly('debuff_drain', centerOf(el), from, 1.1);
      B.gauge[k] = Math.floor(B.gauge[k] / 2);
      updateGauges();
      Debuff.say(el, '수수께끼에 게이지를 뺏겼어', '#c58b2b');
    } else if (kind === 'bubble') {
      const spots = [];
      Board.each(B.grid, (t, r, c) => { if (t && t.type >= 0 && !t.special && !t.lock && !t.block) spots.push([r, c]); });
      spots.sort(() => Math.random() - 0.5);
      for (const [r, c] of spots.slice(0, 2)) {
        const old = B.grid[r][c], to = tileCenter(r, c);
        await Debuff.fly(ITEM('bubble'), from, to, 0.9, true);
        const tile = newBlock('bubble', 1);
        B.grid[r][c] = tile;
        popTile(old, 0);
        makeTile(tile);
        place(tile, r, c);
        squish(tile);
      }
      Debuff.say($('#boardWrap'), '거품을 뿜었다!', '#4aa8e0');
      if (!Board.hasMove(B.grid)) await cascade(null, []);
    } else if (kind === 'stomp') {
      Debuff.cloud('fx_dust');
      shake(16, 500);
      Sound.play('land', 0.6, 1);
      Board.shuffle(B.grid);
      await settleAll(420);
      Debuff.say($('#boardWrap'), '쿵쿵! 판이 뒤섞였어', '#8a6a4a');
    } else if (kind === 'heal') {
      const amt = Math.round(mon.max * 0.15);
      mon.hp = Math.min(mon.max, mon.hp + amt);
      updateMon();
      floatNum(from.x, from.y - 20, `+${amt}`, '#3fae4f');
      burst(from.x, from.y, '#8fe0a0', 10);
      Sound.play('heal', 1, 0.6);
    }
    Debuff.render();
  },
  // 그림 하나가 괴물에서 목표로 날아감
  fly(src, a, b, scale = 1, raw = false) {
    const im = new Image();
    im.src = raw ? src : DBF(src);
    im.className = 'fximg';
    Object.assign(im.style, { left: a.x + 'px', top: a.y + 'px', width: B.S * scale + 'px', zIndex: 9 });
    fx.appendChild(im);
    const dx = b.x - a.x, dy = b.y - a.y;
    return im.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.45 - 60}px)) scale(1.1) rotate(-10deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(8deg)`, opacity: 1, offset: 0.85 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.4)`, opacity: 0 },
    ], { duration: 620, easing: 'ease-in-out' }).finished.then(() => im.remove(), () => im.remove());
  },
  // 판 전체를 덮는 구름 (어둠·흙먼지)
  cloud(src) {
    const b = centerOf($('#boardWrap'));
    const im = new Image();
    im.src = DBF(src);
    im.className = 'fximg';
    Object.assign(im.style, { left: b.x + 'px', top: b.y + 'px', width: b.w * 1.1 + 'px', zIndex: 9 });
    fx.appendChild(im);
    im.animate([
      { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.95, offset: 0.35 },
      { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 0 },
    ], { duration: 900, easing: 'ease-out' }).finished.then(() => im.remove(), () => im.remove());
  },
  say(el, text, color) {
    const c = centerOf(el);
    floatNum(c.x, c.y - 24, text, color);
  },
  // 팀 체력바 옆 디버프 칩 + 잠든 친구 얼굴에 zzz
  render() {
    const row = $('#teamRow');
    if (!row) return;
    let box = $('#debuffs');
    if (!box) { box = document.createElement('div'); box.id = 'debuffs'; row.after(box); }
    const s = Debuff.s, chips = [];
    if (s.poison > 0) chips.push(['poison', s.poison]);
    if (s.weak > 0) chips.push(['weak', s.weak]);
    const zz = Object.keys(s.sleep).length;
    if (zz) chips.push(['sleep', Math.max(...Object.values(s.sleep))]);
    box.innerHTML = chips.map(([k, n]) => `<span class="dbf ${k}"><img src="${DBF(DEBUFF_INFO[k].img)}" alt="">${DEBUFF_INFO[k].name}<b>${n}</b></span>`).join('');
    box.style.display = chips.length && B.mode === 'battle' ? '' : 'none';
    [...$('#party').children].forEach((el, k) => el.classList.toggle('asleep', Debuff.asleep(k)));
  },
};
