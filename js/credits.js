// 만든 사람·출처: 게임에 들어간 그림·소리·코드 파일을 하나도 빠짐없이 출처별로 적어 둠
// 설정 → 만든 사람·출처(게임 안), credits.html(누구나 보는 출처 페이지), CREDITS.md(저장소)가 모두 이걸 읽음
// 새 그림·소리를 넣으면 여기 files에 적기. node tools/credits.js 가 빠진 파일·없는 파일을 잡고 CREDITS.md를 새로 씀 (배포 전 점검에서도 돎)
// files: assets/ 아래 폴더 → 파일 이름들
const CREDIT_SECTIONS = {
  orig: { name: '원작 그림', note: '원작 「ちいかわ なんか小さくてかわいいやつ」의 그림이에요. 이용 허락을 받은 그림이 아니고, 권리는 모두 원저작자에게 있어요. 권리자께서 요청하시면 바로 내리겠습니다.' },
  made: { name: '이 게임에서 만든 그림', note: 'AI 그림 도구와 코드로 이 게임을 위해 새로 만든 그림이에요.' },
  free: { name: '무료 그림 소재', note: '자유롭게 쓸 수 있는 라이선스로 공개된 소재예요.' },
  audio: { name: '소리', note: '' },
  code: { name: '글꼴과 코드', note: '' },
};
const CREDITS = [
  { sec: 'orig', title: '퍼즐 얼굴', by: '© nagano / chiikawa committee',
    src: [['인터넷에서 모은 원작 이미지 (원본 주소 기록 없음)', '']],
    did: '얼굴만 오려 냄',
    files: {
      'img/faces': [
        'beetle.png', 'chiikawa.png', 'darkstar.png', 'goblin.png', 'hachiware.png', 'kani.png', 'kurimanju.png', 'momonga.png',
        'rakko.png', 'shisa.png', 'shooting.png', 'usagi.png',
      ],
    },
  },
  { sec: 'orig', title: '퍼즐 구슬', by: '© nagano / chiikawa committee',
    src: [['위 퍼즐 얼굴', '']],
    did: '퍼즐 얼굴에 친구 색 테두리를 둘러 만듦',
    files: {
      'img/tiles': [
        'beetle.png', 'chiikawa.png', 'darkstar.png', 'goblin.png', 'hachiware.png', 'kani.png', 'kurimanju.png', 'momonga.png',
        'rakko.png', 'shisa.png', 'shooting.png', 'usagi.png',
      ],
    },
  },
  { sec: 'orig', title: '앱 아이콘', by: '© nagano / chiikawa committee',
    src: [['위 퍼즐 구슬', '']],
    did: '퍼즐 구슬을 분홍 바탕에 모아 만듦',
    files: {
      'img/app': ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
    },
  },
  { sec: 'orig', title: '전신·포즈 일러스트', by: '© nagano / chiikawa committee',
    src: [['Chiikawa Wiki (Fandom)', 'https://chiikawa.fandom.com/']],
    did: '배경을 지움',
    files: {
      'img/art': [
        'armor_labor.png', 'armor_one.png', 'armors.png', 'body_kani.png', 'pajama_uwawa.png', 'pose_chiikawa.png',
        'pose_chiikawa2.png', 'pose_hachiware.png', 'pose_hachiware2.png', 'pose_kurimanju.png', 'pose_momonga.png',
        'pose_rakko.png', 'pose_shisa.png', 'pose_usagi.png', 'pose_usagi2.png', 'usagi_haa.png',
      ],
      'img/chars': ['chiikawa.png', 'hachiware.png', 'kurimanju.png', 'momonga.png', 'rakko.png', 'shisa.png', 'usagi.png'],
      'img/npc': ['armor.png'],
    },
  },
  { sec: 'orig', title: '애니메이션 장면 (오프닝·이야기)', by: '© nagano / chiikawa committee',
    src: [['Chiikawa Wiki (Fandom)', 'https://chiikawa.fandom.com/']],
    did: '크기를 줄임',
    files: {
      'img/art': ['scene_crying.jpg', 'scene_goblins.jpg', 'scene_magical.jpg', 'scene_pajama_dance.jpg', 'scene_scared.jpg'],
    },
  },
  { sec: 'orig', title: '괴물', by: '© nagano / chiikawa committee',
    src: [['Chiikawa Wiki (Fandom)', 'https://chiikawa.fandom.com/']],
    did: '배경을 지움',
    files: {
      'img/monsters': ['anoko.webp', 'blackstar.webp', 'chimera.webp', 'dekatsuyo.webp', 'elephant.webp', 'mimic.webp', 'ode.webp', 'sphinx.webp'],
    },
  },
  { sec: 'orig', title: '인어섬 괴물 (세이렌·인어)', by: '© nagano / 「映画ちいかわ」製作委員会',
    src: [['『映画ちいかわ 人魚の島のひみつ』 공식 사이트 캐릭터 그림', 'https://chiikawa.toho-movie.jp/']],
    did: '배경을 지움',
    files: {
      'img/monsters': ['mermaid.webp', 'siren.webp'],
    },
  },
  { sec: 'orig', title: '춤추는 치이카와 GIF', by: '© nagano',
    src: [['작가 nagano의 GIPHY', 'https://giphy.com/ngntrtr']],
    did: '그대로 씀',
    files: {
      'img/skins/chiikawa': ['dance.gif'],
    },
  },
  { sec: 'orig', title: '옷 갈아입히기', by: '© nagano / chiikawa committee',
    src: [['Chiikawa Wiki (Fandom)', 'https://chiikawa.fandom.com/']],
    did: '애니메이션·만화 장면과 공식 일러스트에서 친구만 오려 냄',
    note: '마법소녀 옷은 MV 「まじかるちいかわ」, 산타 옷은 공식 콜라보 영상 「サンタ・テル・ミー」, 가리비 옷은 明星 チャルメラ 광고 「ホタテ三重奏篇」, 랏코 가면 히어로는 애니메이션 장면에서',
    files: {
      'img/skins/chiikawa': [
        'cry.png', 'gelsheet.png', 'hotate.png', 'magical.png', 'melon.png', 'pochette.png', 'santa.png', 'sasumata.png',
        'sprout.png', 'squid.png', 'tanuki.png',
      ],
      'img/skins/hachiware': ['bugnet.png', 'guitar.png', 'hotate.png', 'magical.png', 'santa.png', 'sasumata.png', 'tanuki.png'],
      'img/skins/kurimanju': ['magical.png'],
      'img/skins/momonga': ['magical.png', 'santa.png'],
      'img/skins/rakko': ['mask.png', 'santa.png'],
      'img/skins/shisa': ['magical.png'],
      'img/skins/usagi': ['hotate.png', 'magical.png', 'neckie.png', 'santa.png', 'squid.png'],
    },
  },
  { sec: 'orig', title: '스페셜 옷 배경 장면', by: '© nagano / chiikawa committee',
    src: [['MV 「まじかるちいかわ」 장면', '']],
    did: '크기를 줄임',
    files: {
      'img/scenes': ['magical_chiikawa.jpg', 'magical_hachiware.jpg', 'magical_meadow.jpg', 'magical_momonga.jpg', 'magical_usagi.jpg'],
    },
  },
  { sec: 'orig', title: '산타 옷 배경 장면', by: '© nagano / chiikawa committee',
    src: [['공식 콜라보 영상 「サンタ・テル・ミー」 장면', '']],
    did: '크기를 줄임',
    files: {
      'img/scenes': ['santa_chiikawa.jpg', 'santa_hachiware.jpg', 'santa_momonga.jpg', 'santa_rakko.jpg', 'santa_usagi.jpg'],
    },
  },
  { sec: 'orig', title: '가리비 옷 배경 장면', by: '© nagano / chiikawa committee',
    src: [['明星 チャルメラ 광고 「ホタテ三重奏篇」 장면', '']],
    did: '크기를 줄임',
    files: {
      'img/scenes': ['hotate_chiikawa.jpg', 'hotate_hachiware.jpg', 'hotate_usagi.jpg'],
    },
  },
  { sec: 'orig', title: '가면 히어로 배경 장면', by: '© nagano / chiikawa committee',
    src: [['Chiikawa Wiki (Fandom)', 'https://chiikawa.fandom.com/']],
    did: '크기를 줄임',
    files: {
      'img/scenes': ['rakko_mask.jpg'],
    },
  },
  { sec: 'orig', title: '도전 화면·타이틀 그림', by: '© nagano / chiikawa committee, 「映画ちいかわ」製作委員会, Applibot',
    src: [['원작 애니메이션·영화·게임 이미지', '']],
    did: '크기를 맞춰 자름',
    note: '인어섬(ch_tower), 제초 검정(ch_contest), 랏코(ch_rank), 타이틀 풀밭(title)',
    files: {
      'img/art': ['ch_contest.jpg', 'ch_rank.jpg', 'ch_tower.jpg', 'title.jpg'],
    },
  },
  { sec: 'orig', title: '링크 공유 카드', by: '© nagano / chiikawa committee',
    src: [['타이틀 풀밭 그림 + 제목 로고', '']],
    did: '둘을 합쳐 1200×630으로',
    files: {
      'img/app': ['og.jpg'],
    },
  },
  { sec: 'made', title: 'VARCO로 생성한 그림', by: '이 게임에서 생성',
    src: [['VARCO (NCSOFT)', 'https://3d.varco.ai']],
    did: '배경을 지우고 크기를 맞춤',
    note: '배경·지도·지역 풍경, 라멘 가게, 집 벽지·바닥, 가구, 아이템(랏코 검·폭탄·경단·종이비행기), 장애물, 터짐 조각, 체력바·스킬 고리, 버튼 아이콘, 제목 로고, 판 목표 글자',
    files: {
      'img': ['battle_bg.jpg', 'map_bg.jpg', 'ramen_bg.jpg'],
      'img/combo': [
        'bomb_bomb.webp', 'bomb_plane.webp', 'bomb_sword.webp', 'dango_any.webp', 'dango_dango.webp', 'plane_plane.webp',
        'sword_plane.webp', 'sword_sword.webp',
      ],
      'img/fx': [
        'dot_l.png', 'dot_m.png', 'drop_b.png', 'drop_p.png', 'heart_l.png', 'heart_o.png', 'heart_p.png', 'heart_r.png',
        'star_b.png', 'star_m.png', 'star_p.png', 'star_y.png', 'twinkle1.png', 'twinkle2.png', 'twinkle3.png', 'twinkle4.png',
      ],
      'img/gacha': ['machine.webp'],
      'img/house': [
        'fl_carpet.webp', 'fl_dark.webp', 'fl_grass.webp', 'fl_sand.webp', 'fl_stone.webp', 'fl_tatami.webp', 'fl_tile.webp',
        'fl_wood.webp', 'w_check.webp', 'w_cloud.webp', 'w_daisy.webp', 'w_dot.webp', 'w_heart.webp', 'w_night.webp',
        'w_star.webp', 'w_stripe.webp',
      ],
      'img/items': [
        'bath.png', 'bento.png', 'bombball.png', 'bombball_o.png', 'box.png', 'bubble.png', 'clock.png', 'coin.png', 'dango.png',
        'dango3.png', 'dango3_o.png', 'donut.png', 'egg.png', 'f_balloon.png', 'f_board.png', 'f_bookcase.png', 'f_cake.png',
        'f_clock.png', 'f_cushion.png', 'f_frame.png', 'f_fridge.png', 'f_futon.png', 'f_garland.png', 'f_grass.png',
        'f_kotatsu.png', 'f_lamp.png', 'f_monstera.png', 'f_poster.png', 'f_rice.png', 'f_rug.png', 'f_shelf.png', 'f_sofa.png',
        'f_stool.png', 'f_table.png', 'f_tissue.png', 'f_toybox.png', 'f_tv.png', 'f_wclock.png', 'f_window.png', 'gift.png',
        'hand.png', 'heart.png', 'house.png', 'medal.png', 'naruto.png', 'onigiri.png', 'pancake.png', 'paperplane.png',
        'paperplane_o.png', 'parfait.png', 'pot.png', 'ramen.png', 'ribbon.png', 'sparkle.png', 'star.png', 'stick.png',
        'sword.png', 'sword_o.png', 'target.png', 'timer.png', 'weed1.png', 'weed2.png',
      ],
      'img/map': ['m1.jpg', 'm10.jpg', 'm2.jpg', 'm3.jpg', 'm4.jpg', 'm5.jpg', 'm6.jpg', 'm7.jpg', 'm8.jpg', 'm9.jpg'],
      'img/obst': [
        'box_flap.png', 'box_open.png', 'bubble_pop.png', 'dirt.png', 'foam_tex.webp', 'leaf.png', 'ribbon_loose.png',
        'sprout_pull.png', 'weed_pull.png',
      ],
      'img/stage': ['s1.jpg', 's10.jpg', 's2.jpg', 's3.jpg', 's4.jpg', 's5.jpg', 's6.jpg', 's7.jpg', 's8.jpg', 's9.jpg'],
      'img/ui': [
        'back.png', 'bar_fill.png', 'bar_fill_red.png', 'bar_frame.png', 'book.png', 'cd_clock.png', 'check.png', 'crown.png',
        'debuff_drain.webp', 'debuff_poison.webp', 'debuff_sleep.webp', 'debuff_weak.webp', 'fx_dark.webp', 'fx_dust.webp',
        'fx_poison.webp', 'fx_sleep.webp', 'gear.png', 'home.png', 'lock.png', 'logo.png', 'next.png', 'note.png', 'ring_fill.png',
        'ring_frame.png', 'sk_burst.png', 'sk_cross.png', 'sk_line_h.png', 'sk_line_v.png', 'sk_meteor.png', 'sk_rally.png',
        'sk_shuffle.png', 'sk_slash.png', 'star_off.png', 'star_on.png',
      ],
      'img/ui/words': [
        'battle.webp', 'box.webp', 'bubble.webp', 'char.webp', 'clear.webp', 'exam.webp', 'ing.webp', 'lock.webp', 'score.webp',
        'syrup.webp', 'weed.webp',
        // 판마다 다른 끝 글자 (라멘 완성!, 1차 합격! 등)
        'd01.webp', 'd02.webp', 'd03.webp', 'd04.webp', 'd05.webp', 'd06.webp', 'd07.webp', 'd08.webp', 'd09.webp', 'd10.webp',
        'd11.webp', 'd12.webp', 'd13.webp', 'd14.webp', 'd15.webp', 'd16.webp', 'd17.webp', 'd18.webp', 'd19.webp', 'd20.webp',
        'd21.webp', 'd22.webp', 'd23.webp', 'd24.webp', 'd25.webp', 'd26.webp', 'd27.webp', 'd28.webp', 'd29.webp', 'd30.webp',
        'd31.webp', 'd32.webp', 'd33.webp', 'd34.webp', 'd35.webp', 'd36.webp', 'd37.webp', 'd38.webp', 'd39.webp', 'd40.webp',
        'd41.webp', 'd42.webp', 'd43.webp', 'd44.webp', 'd45.webp', 'd46.webp', 'd47.webp', 'd48.webp', 'd49.webp', 'd50.webp',
        'd51.webp', 'd52.webp', 'd53.webp', 'd54.webp', 'd55.webp', 'd56.webp', 'd57.webp', 'd58.webp', 'd59.webp', 'd60.webp',
        'd61.webp', 'd62.webp', 'd63.webp', 'd64.webp', 'd65.webp', 'd66.webp', 'd67.webp', 'd68.webp', 'd69.webp',
      ],
    },
  },
  { sec: 'made', title: '시럽·국물 무늬', by: '이 게임에서 만듦',
    src: [['코드로 그림 (tools/make_syrup_tex.py)', '']],
    files: {
      'img/obst': ['broth_tex.webp', 'syrup_tex.webp'],
    },
  },
  { sec: 'made', title: '숫자·글자 그림', by: '이 게임에서 만듦',
    src: [['Jua 글꼴 (SIL Open Font License)', 'https://fonts.google.com/specimen/Jua']],
    did: '글꼴로 코드에서 그림 (점수·피버·데미지 숫자, +, 초, 보너스 타임!, 피버 타임!, 선물! 등)',
    files: {
      'img/combo': [
        'f0.webp', 'f1.webp', 'f2.webp', 'f3.webp', 'f4.webp', 'f5.webp', 'f6.webp', 'f7.webp', 'f8.webp', 'f9.webp',
        'fbadge.webp', 'fsec.webp', 'fsub_atk.webp', 'fsub_score.webp', 'fsub_score10.webp', 'ftag_cheer.webp', 'fturn.webp',
        'm0.webp', 'm1.webp', 'm2.webp', 'm3.webp', 'm4.webp', 'm5.webp', 'm6.webp', 'm7.webp', 'm8.webp', 'm9.webp',
        'mminus.webp', 'n0.webp', 'n1.webp', 'n2.webp', 'n3.webp', 'n4.webp', 'n5.webp', 'n6.webp', 'n7.webp', 'n8.webp',
        'n9.webp', 'plus.webp', 'sec.webp', 'w_bonus.webp', 'w_fever.webp', 'w_gift.webp',
      ],
    },
  },
  { sec: 'made', title: '콤보 숫자·칭찬 글자', by: '이 게임에서 만듦',
    src: [['Jua 글꼴 (SIL Open Font License)', 'https://fonts.google.com/specimen/Jua']],
    did: '콤보 숫자와 좋아!·멋져!·굉장해! 같은 칭찬 글자',
    check: true, // 만든 방법이 기록에 없음: 글꼴로 그렸는지 VARCO로 뽑았는지 확인 필요
    files: {
      'img/combo': [
        'd0.webp', 'd1.webp', 'd2.webp', 'd3.webp', 'd4.webp', 'd5.webp', 'd6.webp', 'd7.webp', 'd8.webp', 'd9.webp',
        'w_amazing.webp', 'w_best.webp', 'w_combo.webp', 'w_good.webp', 'w_great.webp', 'w_nice.webp',
      ],
    },
  },
  { sec: 'free', title: 'Noto Emoji 아이콘', by: 'Google',
    src: [['Noto Emoji', 'https://github.com/googlefonts/noto-emoji']],
    lic: 'Apache License 2.0 (assets/img/items/LICENSE-noto.txt)',
    did: '크기를 맞추고 일부는 흰 테두리를 그림',
    files: {
      'img/items': [
        'bed.png', 'berry.png', 'bomb.png', 'boom.png', 'candle.png', 'cap.png', 'crown.png', 'frame.png', 'gradcap.png', 'h.png',
        'honey.png', 'mirror.png', 'phones.png', 'plane.png', 'plant.png', 'rainbow.png', 'rocket.png', 'sakura.png', 'shades.png',
        'sofa.png', 'sponge.png', 'sunflower.png', 'teddy.png', 'tophat.png', 'tv.png', 'v.png',
      ],
    },
  },
  { sec: 'free', title: 'Kenney Particle Pack', by: 'Kenney',
    src: [['Kenney Particle Pack', 'https://kenney.nl/assets/particle-pack']],
    lic: 'CC0 (assets/img/fx/k/LICENSE-kenney-particles.txt)',
    did: '게임 안에서 색을 입힘',
    files: {
      'img/fx/k': [
        'circle_03.png', 'circle_05.png', 'flare_01.png', 'light_02.png', 'magic_02.png', 'slash_03.png', 'smoke_04.png',
        'spark_05.png', 'star_04.png', 'star_06.png', 'star_09.png', 'symbol_01.png', 'twirl_01.png',
      ],
    },
  },
  { sec: 'free', title: 'Kenney Explosion Pack', by: 'Kenney',
    src: [['Kenney Explosion Pack', 'https://kenney.nl/assets/explosion-pack']],
    lic: 'CC0',
    did: '흰 모양으로 바꿈',
    files: {
      'img/fx/sharp': ['burst.png'],
    },
  },
  { sec: 'free', title: '날카로운 이펙트 모양', by: 'Lorc (sparkles는 Delapouite)',
    src: [['game-icons.net', 'https://game-icons.net']],
    lic: 'CC BY 3.0 (assets/img/fx/sharp/LICENSE.txt)',
    did: '검은 바탕을 지우고 흰 256px 모양으로 바꿈. 게임 안에서 색과 테두리를 입힘',
    files: {
      'img/fx/sharp': [
        'claw-slashes.png', 'crossed-slashes.png', 'explosion-rays.png', 'gooey-impact.png', 'quick-slash.png', 'sparkles.png',
        'spiky-explosion.png',
      ],
    },
  },
  { sec: 'audio', title: '배경 음악', by: '곡마다 아래 작가',
    src: [['OpenGameArt', 'https://opengameart.org/']],
    lic: 'CC0',
    did: '112kbps mp3로 줄임',
    titles: { 'map.mp3': 'Caturday - iamoneabe', 'life1.mp3': 'happy lofi day - Tarush Singhal', 'life2.mp3': 'Florist - Tad', 'life3.mp3': 'Countryside - Tad', 'ramen.mp3': 'Cat caffe - Tad', 'battle.mp3': 'Trouble in the Garden - Augmentality', 'boss.mp3': 'Baby Black Magi - bobjt' },
    files: {
      'bgm': ['battle.mp3', 'boss.mp3', 'life1.mp3', 'life2.mp3', 'life3.mp3', 'map.mp3', 'ramen.mp3'],
    },
  },
  { sec: 'audio', title: '효과음', by: 'floraphonic, humordome 외',
    src: [['Pixabay', 'https://pixabay.com/sound-effects/'], ['Mixkit', 'https://mixkit.co/free-sound-effects/']],
    lic: 'Pixabay Content License, Mixkit Sound Effects Free License (소리 파일만 따로 떼어 배포하는 것은 허용되지 않음)',
    did: '크기를 맞추고 일부는 잘라서 mp3로',
    files: {
      'sfx': [
        'bad.mp3', 'click.mp3', 'defeat.mp3', 'enemy.mp3', 'heal.mp3', 'hit.mp3', 'jingle_lose.mp3', 'jingle_skill.mp3',
        'jingle_start.mp3', 'jingle_win.mp3', 'land.mp3', 'line.mp3', 'open.mp3', 'pop.mp3', 'rainbow.mp3', 'sparkle.mp3',
        'special.mp3', 'star.mp3', 'swap.mp3', 'wave.mp3', 'win.mp3',
      ],
    },
  },
  { sec: 'code', title: 'Firebase JavaScript SDK 10.12.2', by: 'Google',
    src: [['firebase-js-sdk', 'https://github.com/firebase/firebase-js-sdk']],
    lic: 'Apache License 2.0',
    files: {
      'vendor': ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'],
    },
  },
  { sec: 'code', title: 'Poor Story 글꼴 (게임 글씨)', by: 'Yoon Design',
    src: [['Google Fonts', 'https://fonts.google.com/specimen/Poor+Story']],
    lic: 'SIL Open Font License 1.1', did: 'Google Fonts에서 바로 불러옴',
    files: {},
  },
];
const Credits = {
  paths: g => Object.entries(g.files).flatMap(([d, ns]) => ns.map(n => `${d}/${n}`)),
  count: g => Credits.paths(g).length,
  isImg: p => /\.(png|jpe?g|webp|gif)$/i.test(p),
  link: ([label, url]) => (url ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : label),
  total() {
    const all = CREDITS.flatMap(Credits.paths);
    return { img: all.filter(Credits.isImg).length, snd: all.filter(p => /\.mp3$/.test(p)).length };
  },
  // 게임 안 창과 credits.html이 같이 씀
  html() {
    const t = Credits.total();
    const group = g => {
      const n = Credits.count(g);
      const files = Object.entries(g.files).map(([d, ns]) => `<div class="cr-dir">assets/${d}/</div><div class="cr-files">${ns.map(f => {
        const p = `${d}/${f}`, cap = g.titles?.[f] ? `${f}<br>${g.titles[f]}` : f;
        return Credits.isImg(p) ? `<figure><img src="assets/${p}" loading="lazy" alt=""><figcaption>${f}</figcaption></figure>` : `<span>${cap}</span>`;
      }).join('')}</div>`).join('');
      return `<section class="cr-group"><h4>${g.title}${n ? `<small>${n}개</small>` : ''}</h4>
        <dl><dt>권리</dt><dd>${g.by}</dd><dt>출처</dt><dd>${g.src.map(Credits.link).join(', ')}</dd>${g.lic ? `<dt>라이선스</dt><dd>${g.lic}</dd>` : ''}${g.did ? `<dt>손본 것</dt><dd>${g.did}</dd>` : ''}${g.note ? `<dt>참고</dt><dd>${g.note}</dd>` : ''}</dl>
        ${n ? `<details><summary>파일 ${n}개 보기</summary>${files}</details>` : ''}</section>`;
    };
    return `<p class="cr-intro">먼작귀 퍼즐 토벌 대작전!은 팬이 만든 <b>비공식 게임</b>이에요. 원작자 나가노 및 치이카와 제작위원회와 관계가 없고, 돈을 받지 않아요.<br>게임에 들어간 그림 ${t.img}개와 소리 ${t.snd}개를 파일마다 어디서 왔는지 아래에 적어 뒀어요.</p>` +
      Object.entries(CREDIT_SECTIONS).map(([k, s]) => `<h3 class="cr-sec">${s.name}</h3>${s.note ? `<p class="cr-note">${s.note}</p>` : ''}${CREDITS.filter(g => g.sec === k).map(group).join('')}`).join('');
  },
  open() {
    const card = $('#charSheet .sheet-card');
    card.style.setProperty('--ring', '#ff8ab8');
    card.innerHTML = `<div class="mates-title">만든 사람·출처</div><div class="credit-list">${Credits.html()}<p class="cr-note"><a href="credits.html" target="_blank" rel="noopener">이 목록을 웹 페이지로 보기</a></p></div>
      <div class="sheet-btns"><button class="big-btn" data-go>닫기</button></div>`;
    card.querySelector('[data-go]').onclick = () => { Sound.play('click'); $('#charSheet').classList.remove('show'); openSettings(); };
    $('#charSheet').classList.add('show');
  },
};
