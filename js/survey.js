// 설문: 12판을 깨면 지도에서 한 번 "게임 재밌어?" (별 1~5 + 하고 싶은 말, 말은 선택)
// '나중에'를 누르면 10판 더 깨고 한 번 더, 그래도 안 하면 다시 안 물어봄. 설정의 '의견 보내기'로는 언제든
// 보낸 건 Firestore feedback 컬렉션에 쌓임 (누구나 쓰기만, 읽기는 Firebase 콘솔에서)
const SURVEY_AT = 12, SURVEY_COINS = 50;
const Survey = {
  // 지도에 왔을 때 물어볼 차례인지
  due() {
    const s = Save.data.survey || {};
    if (s.sent || (s.asked || 0) >= 2 || typeof Net === 'undefined' || !Net.on) return false;
    return clearedCount() >= (s.next || SURVEY_AT);
  },
  // from: 'auto' 지도에서 저절로 / 'settings' 설정에서
  open(from = 'auto') {
    return new Promise(done => {
      const s = (Save.data.survey = Save.data.survey || {});
      if (from === 'auto') { s.asked = (s.asked || 0) + 1; s.next = clearedCount() + 10; Save.save(); }
      let stars = 0;
      const card = $('#charSheet .sheet-card');
      card.style.setProperty('--ring', '#4f93dc');
      card.innerHTML = `<div class="mates-title">게임 재밌어?</div>
        <div class="helper-pick"><span class="fig"><img src="${artOf('hachiware')}" draggable="false"></span><div><b>하치와레</b><p>여기까지 와 줘서 고마워! 별점이랑 하고 싶은 말을 남겨 주면 다음 업데이트에 꼭 참고할게~</p></div></div>
        <div class="survey-stars">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" aria-label="별 ${n}개"><img src="${ITEM('star')}" alt=""></button>`).join('')}</div>
        <textarea class="survey-text" maxlength="500" rows="4" placeholder="재밌었던 것, 어려웠던 스테이지, 바라는 것… (안 써도 돼요)"></textarea>
        <div class="survey-note">${from === 'auto' && !s.coins ? `보내 주면 ${SURVEY_COINS}코인 선물! · ` : ''}닉네임 없이 보내져요</div>
        <div class="sheet-btns"><button class="big-btn ghost" data-back>나중에</button><button class="big-btn" data-go disabled>보내기</button></div>`;
      const go = card.querySelector('[data-go]'), text = card.querySelector('.survey-text');
      const paint = () => card.querySelectorAll('.survey-stars button').forEach(b => b.classList.toggle('on', +b.dataset.n <= stars));
      card.querySelectorAll('.survey-stars button').forEach(b => (b.onclick = () => {
        stars = +b.dataset.n;
        go.disabled = false;
        paint();
        Sound.play('star', 1 + stars * 0.08, 0.6);
        b.animate([{ transform: 'scale(1.4) rotate(-12deg)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.6,1)' });
      }));
      const close = () => { $('#charSheet').classList.remove('show'); done(); };
      card.querySelector('[data-back]').onclick = () => { Sound.play('click'); close(); };
      go.onclick = async () => {
        if (!stars) return;
        go.disabled = true;
        const ok = await Survey.send(stars, text.value.trim(), from);
        Sound.play(ok ? 'jingle_win' : 'bad', 1.1, 0.8);
        close();
        const gift = ok && !s.coins ? SURVEY_COINS : 0;
        if (ok) { s.sent = true; s.stars = stars; if (gift) { s.coins = true; Meta.addCoins(gift); } Save.save(); }
        modal(ok
          ? { title: '고마워!', char: 'hachiware', text: '하치와레: 잘 받았어! 더 재밌게 만들어 볼게~', rows: gift ? [[`<img class="row-ic" src="${ITEM('coin')}">`, '+' + gift]] : [], btn1: '좋아!', on1: () => {} }
          : { title: '앗, 못 보냈어요', char: 'chiikawa', text: '인터넷이 안 되는 것 같아요. 다음에 설정 → 의견 보내기로 다시 보내 주세요!', btn1: '알았어', on1: () => {} });
      };
      $('#charSheet').classList.add('show');
      fitText($('#charSheet'));
    });
  },
  async send(stars, text, from) {
    try {
      await Net.db.collection('feedback').add({
        stars, text: text.slice(0, 500), cleared: clearedCount(), from, ver: String(VER).slice(0, 20), ua: navigator.userAgent.slice(0, 160),
        uid: Net.user?.uid || '', at: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    } catch { return false; }
  },
};
