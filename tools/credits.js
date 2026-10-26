// 출처 점검: assets/ 아래 그림·소리·코드 파일이 js/credits.js에 하나도 빠짐없이 적혀 있는지 보고, CREDITS.md를 새로 씀
// node tools/credits.js           점검하고 CREDITS.md를 씀
// node tools/credits.js --check   점검만 (CREDITS.md가 js/credits.js와 다르면 실패) — 배포 전 점검에서 돎
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/credits.js'), 'utf8') + ';this.CREDITS = CREDITS; this.SECTIONS = CREDIT_SECTIONS; this.Credits = Credits;', ctx);
const { CREDITS, SECTIONS, Credits } = ctx;

// 출처를 안 적어도 되는 것: 라이선스 원문, 목소리 칸 안내
const SKIP = p => p.endsWith('.txt') || p.startsWith('voice/');
const walk = d => fs.readdirSync(path.join(ROOT, 'assets', d), { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(path.posix.join(d, e.name)) : [path.posix.join(d, e.name)]));
const onDisk = walk('').map(p => p.replace(/^\//, '')).filter(p => !SKIP(p));
const listed = CREDITS.flatMap(Credits.paths);
const errs = [];
const seen = new Set();
listed.forEach(p => { if (seen.has(p)) errs.push(`두 번 적힘: assets/${p}`); seen.add(p); });
listed.filter(p => !fs.existsSync(path.join(ROOT, 'assets', p))).forEach(p => errs.push(`적혀 있는데 파일이 없음: assets/${p}`));
onDisk.filter(p => !seen.has(p)).forEach(p => errs.push(`출처가 안 적힘: assets/${p} → js/credits.js에 추가`));

// CREDITS.md: 사람이 읽는 표
const t = Credits.total();
const md = ['# 만든 사람·출처', '',
  '> 이 파일은 `node tools/credits.js`가 `js/credits.js`에서 만듭니다. 고칠 땐 `js/credits.js`를 고치세요.', '',
  `먼작귀 퍼즐 토벌 대작전!은 팬이 만든 **비공식 게임**입니다. 원작자 나가노 및 치이카와 제작위원회와 관계가 없고, 돈을 받지 않습니다. 게임에 들어간 그림 ${t.img}개와 소리 ${t.snd}개의 출처를 파일마다 적었습니다. 게임 안에서는 설정 → 만든 사람·출처, 웹에서는 \`credits.html\`에서 같은 목록을 볼 수 있습니다.`, ''];
const cell = s => String(s || '').replace(/\|/g, '\\|');
const link = ([label, url]) => (url ? `[${label}](${url})` : label);
for (const [k, s] of Object.entries(SECTIONS)) {
  md.push(`## ${s.name}`, '');
  if (s.note) md.push(s.note, '');
  for (const g of CREDITS.filter(g => g.sec === k)) {
    const n = Credits.count(g);
    md.push(`### ${g.title}${n ? ` (${n}개)` : ''}`, '');
    md.push(`- 권리: ${g.by}`, `- 출처: ${g.src.map(link).join(', ')}`);
    if (g.lic) md.push(`- 라이선스: ${g.lic}`);
    if (g.did) md.push(`- 손본 것: ${g.did}`);
    if (g.note) md.push(`- 참고: ${g.note}`);
    md.push('');
    for (const [d, ns] of Object.entries(g.files)) md.push(`- \`assets/${d}/\`: ${ns.map(f => `\`${f}\`${g.titles?.[f] ? ` (${cell(g.titles[f])})` : ''}`).join(', ')}`);
    if (n) md.push('');
  }
}
const out = md.join('\n').replace(/\n+$/, '\n');
const mdPath = path.join(ROOT, 'CREDITS.md');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(mdPath) || fs.readFileSync(mdPath, 'utf8') !== out) errs.push('CREDITS.md가 js/credits.js와 달라요 → node tools/credits.js 로 다시 쓰기');
} else fs.writeFileSync(mdPath, out);
const todo = CREDITS.filter(g => g.check).map(g => g.title);
if (todo.length) console.log(`확인 필요(만든 방법 기록 없음): ${todo.join(', ')}`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`출처 점검 통과: 파일 ${listed.length}개 (그림 ${t.img}, 소리 ${t.snd})`);
