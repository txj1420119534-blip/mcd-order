import {fresh, restore, begin, finish, recharge, eligible, GAMES, COST} from './ledger.js';
import {drawArt, MergeGame, ShooterGame, FOOD} from './engines.js';
import {ART_FILES, loadGameArt, artReady, artMarkup} from './raster-art.js';
import {generatePuzzle, getHint, validatePlacements} from './puzzle.js';
import {restoreProfile, recordBest, togglePuzzleCell, settleInterruptedRuns, makeDemoId, DEMO_PERSONAS} from './arcade.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const KEY = 'mcmac-club-v1', PROFILE_KEY = 'mcmac-profile-v1';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let artLoadFailed = false;
let state, profile, engine = null, run = null, puzzleData, pieces = [], marks = [], mode = 'king', paused = false, modalResume = false, selectedCell = null, hintCell = null, storageWarning = false;
function storageUnavailable() { storageWarning = true; $('#storageNotice').hidden = false; }
try { state = restore(localStorage.getItem(KEY)); } catch { state = fresh(); storageUnavailable(); }
try { profile = restoreProfile(localStorage.getItem(PROFILE_KEY), makeDemoId()); } catch { profile = restoreProfile(null, makeDemoId()); storageUnavailable(); }
const interrupted = settleInterruptedRuns(state, finish);
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
  catch { storageUnavailable(); }
}
function update() {
  save(); $('#balance').textContent = state.balance; $('#couponCount').textContent = state.coupons.length;
  $('#profileName').textContent = profile.name; $('#welcomeName').textContent = profile.name;
  $('#profileBtn .avatar').textContent = ['麦', '厨', '探', '飞'][Math.max(0, DEMO_PERSONAS.indexOf(profile.name))];
  $('.hero-meta span:last-child').textContent = `★ 每${state.mode === 'weekly' ? '周' : '日'}首胜留个纪念`;
  $('#cycleSummary').textContent = `每游戏每${state.mode === 'weekly' ? '周' : '日'}首次获胜记录一张演示券`;
  $$('[data-elig]').forEach(node => { node.textContent = eligible(state, node.dataset.elig) ? `本${state.mode === 'weekly' ? '周' : '日'}首胜纪念待解锁` : '本周期首胜已收藏 · 再玩不重复发券'; });
  $('#bestMerge').textContent = `本机最高 ${profile.bests.merge} 分`; $('#bestShooter').textContent = `本机最高 ${profile.bests.shooter} 分`;
  $$('[data-start], [data-help]').forEach(button => { button.disabled = !artReady(); });
  const pending = pendingPuzzle();
  $('#puzzleProgress').textContent = pending ? `已保存 ${pending.puzzle.pieces.length} / 9 位大王 · 可免费续玩` : '每行、每列、每种口味恰好一位';
  $('[data-start="puzzle"]').innerHTML = pending ? '继续上次寻宝 <span>不再扣分 ↗</span>' : '开启寻宝 <span>88 ✦</span>';
}
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 4200); }
const help = {
  merge: {tag: '01 · 合成挑战', title: '合成大汉堡', mission: '小快乐，合成大满足', goal: '目标：合出当季主推汉堡', body: '只有相同等级的食物碰到一起才会合成。装得太满，超过虚线停留 3 秒，本局就结束。', steps: [['瞄准', '拖动瞄准，松手投放；也可用左右按钮。'], ['合成', '同款碰到一起升一级，留心下一份食物，给大食物留空间。'], ['通关', '一路合成最终汉堡！电脑用 ← → 瞄准，空格投放。']], controls: '拖动瞄准，松手投放 · 电脑 ← → / 空格', order: FOOD.join(' → ')},
  shooter: {tag: '02 · 飞行营救', title: '麦麦岛大营救', mission: '快乐飞船，出动！', goal: '目标：坚持 58 秒，击败乌云首领', body: '驾驶红黄色飞船，自动发射可乐激光。避开敌机和下行导弹；5 点生命耗尽，本局结束。', steps: [['飞行', '按住屏幕拖动飞船；也可用方向按钮或键盘 WASD。'], ['补给', '奶昔＝三向导弹；汉堡＝范围迫击炮；麦乐鸡＝炸弹。'], ['营救', '坚持 58 秒迎战首领，击破其血条获胜。空格或炸弹按钮可清屏。']], controls: '按住拖动飞行 · 自动开火 · 空格 / 按钮释放炸弹'},
  puzzle: {tag: '03 · 口味推理', title: '找到奶昔大王', mission: '九种口味，九位大王', goal: '目标：每行、每列、每种口味各一位', body: '在 9×9 棋盘放置 9 位奶昔大王。颜色和数字对应口味区域；每行、每列、每种区域必须恰好各一位。可以相邻，没有“不能接触”的规则。', steps: [['观察', '数字相同的格子属于同一口味区域，先找小区域里的位置。'], ['标记', '点击放置 / 撤回大王；切换「画叉」排除位置，红框表示冲突。'], ['推理', '逻辑提示解释可确定的一步，不自动代放。进度自动保存，可免费续玩。']], controls: '点一下放大王，再点撤回 · 放大后可横向滑动'}
};
function pendingPuzzle() { return Object.values(state.runs).find(r => r.game === 'puzzle' && r.status === 'playing' && r.puzzle); }
function pauseGame(value) {
  if (!run || run.status !== 'playing') return;
  paused = value; engine?.setPaused(value); $('#pausedOverlay').hidden = !value;
  $('#pauseBtn').textContent = value ? '▶ 继续' : 'Ⅱ 暂停';
}
function show(html) {
  if (run?.status === 'playing' && !$('#gameView').hidden && !paused) { pauseGame(true); modalResume = true; }
  $('#modalContent').innerHTML = html;
  const heading = $('#modalContent h2'); if (heading) heading.id = 'modalTitle';
  if (!$('#modal').open) $('#modal').showModal();
}
function close() { $('#modal').close(); }
$('#closeModal').onclick = close;
$('#modal').addEventListener('click', event => { if (event.target === $('#modal')) close(); });
$('#modal').addEventListener('close', () => { if (modalResume && run?.status === 'playing' && !$('#gameView').hidden) pauseGame(false); modalResume = false; });

function tutorial(game, canStart = true) {
  const h = help[game];
  show(`<span class="modal-label">30 秒上手</span><h2>${h.title}怎么玩</h2><canvas class="tutorial-art" id="tutorialArt" width="560" height="230" aria-hidden="true"></canvas><div class="tutorial-steps">${h.steps.map(([title, text], i) => `<div class="tutorial-step"><b>0${i + 1}</b><strong>${title}</strong><p>${text}</p></div>`).join('')}</div><p>${h.body}</p>${h.order ? `<p><b>完整合成链：</b>${h.order}</p>` : ''}<div class="notice">每局 88 演示积分，确认后才扣除；演示券有消费门槛且不可真实兑换。${game === 'puzzle' ? '棋盘有唯一解；相邻位置允许放大王。' : '暂停时游戏停止；刷新会结束本局，再开局重新扣分。'}</div><button class="primary" id="tutorialDone">${canStart ? '懂了，准备开局 →' : '回到游戏 →'}</button>`);
  drawArt($('#tutorialArt'), game); profile.tutorialSeen[game] = true; save();
  $('#tutorialDone').onclick = () => { if (canStart) { modalResume = false; startConfirm(game); } else close(); };
}
function startConfirm(game, abandonId = null) {
  if (!artReady()) { toast(artLoadFailed ? '图片未能加载，请先点「重新加载图片」' : '图片准备中，请稍等'); return; }
  const h = help[game], g = GAMES[game];
  show(`<span class="modal-label">准备开玩</span><div class="entry-preview">${artMarkup(game === 'shooter' ? 'flight' : 'food', game === 'shooter' ? 0 : game === 'merge' ? 6 : 7, 'entry-sprite')}</div><h2>${abandonId ? '再来一局？' : h.title}</h2><p>${abandonId ? '当前局会结束，已用积分不退。' : h.goal}</p><div class="entry-balance"><div><b>88</b><span>演示积分 / 局</span></div><small>当前余额 <strong>${state.balance}</strong></small></div><div class="entry-reward"><b>${eligible(state, game) ? '本周期首胜纪念' : '本周期纪念已收藏'}</b><span>${eligible(state, game) ? g.reward : '本局不重复记录奖励'}</span><small>演示券不可兑换 · 兑换方案需实付 ¥${g.paid}${game === 'shooter' ? ' · 仅为方案建议' : ''}</small></div><div class="modal-actions"><button id="confirmStart" class="primary" ${state.balance < COST ? 'disabled' : ''}>${state.balance < COST ? '积分不足' : '88 积分，开玩'}</button><button class="secondary" id="cancelStart">再想想</button></div>${state.balance < COST ? '<p class="entry-insufficient">可返回大厅，在积分钱包里使用演示充值。</p>' : ''}<p class="entry-footnote">本地模拟体验，不消耗真实积分。</p>`);
  $('#cancelStart').onclick = close;
  $('#confirmStart').onclick = event => { event.currentTarget.disabled = true; modalResume = false; if (abandonId && state.runs[abandonId]?.status === 'playing') finish(state, abandonId, false); close(); start(game); };
}
function start(game, resumeId = null) {
  engine?.destroy(); engine = null;
  try {
    if (!resumeId) {
      run = begin(state, game, makeDemoId());
      if (game === 'puzzle') { const seed = Object.keys(state.runs).length % 16; puzzleData = generatePuzzle(seed); pieces = []; marks = []; run.puzzle = {seed, pieces, marks}; }
    } else { run = state.runs[resumeId]; if (!run || run.status !== 'playing' || !run.puzzle) throw Error('这局已结束，请重新选择'); puzzleData = generatePuzzle(run.puzzle.seed); pieces = run.puzzle.pieces; marks = run.puzzle.marks; }
  } catch (error) { toast(error.message); return; }
  update(); $('#home').hidden = true; $('#gameView').hidden = false; $('#gameTitle').textContent = help[game].title; $('#gameLabel').textContent = help[game].tag;
  $('#missionTitle').textContent = help[game].mission; $('#mission').innerHTML = `<div class="mission-goal">${help[game].goal}</div><details class="play-details"><summary>怎么玩</summary><p>${help[game].body}</p>${help[game].order ? '<p>' + help[game].order + '</p>' : ''}</details>`;
  $('#runReward').innerHTML = `${artMarkup('flight', 7, 'reward-star')}<b>${run.eligible ? '首胜纪念等你拿' : '本周期首胜已收藏'}</b><span>${GAMES[game].reward}</span><small>本局已扣 ${COST} 演示积分 · 兑换方案需实付 ¥${GAMES[game].paid}<br>演示券不可兑换${run.game === 'shooter' ? ' · 营救奖励仅为方案建议' : ''}</small>`;
  $('#stageWrap').classList.toggle('shooter-stage', game === 'shooter'); $('#runBadge').textContent = '进行中'; $('#gameCanvas').hidden = game === 'puzzle'; $('#puzzleBoard').hidden = game !== 'puzzle'; $('#puzzleViewport').hidden = game !== 'puzzle'; $('#puzzleFeedback').hidden = game !== 'puzzle';
  $('#puzzleToolbar').hidden = game !== 'puzzle'; $('#puzzleViewport').classList.remove('puzzle-zoomed'); $('#puzzleZoomBtn').setAttribute('aria-pressed', 'false'); $('#puzzleZoomBtn').textContent = '放大棋盘 ＋';
  $('#puzzleZoomBtn').onclick = () => { const zoomed = $('#puzzleViewport').classList.toggle('puzzle-zoomed'); $('#puzzleZoomBtn').setAttribute('aria-pressed', zoomed); $('#puzzleZoomBtn').textContent = zoomed ? '显示全盘 −' : '放大棋盘 ＋'; };
  $('#inputHint').textContent = help[game].controls; $('#gameControls').replaceChildren(); paused = false; modalResume = false; selectedCell = null; hintCell = null; $('#pausedOverlay').hidden = true; $('#pauseBtn').textContent = 'Ⅱ 暂停'; $('#pauseBtn').disabled = false; $('#retryBtn').disabled = false;
  const callbacks = {status: text => { $('#status').textContent = text; }, end: won => end(won), notice: toast};
  if (game === 'merge') {
    $('#status').textContent = '合成积分 0 · 下一个：圆筒'; engine = new MergeGame($('#gameCanvas'), callbacks);
    $('#gameControls').innerHTML = '<button class="direction-button" id="aimLeft" aria-label="向左瞄准">←</button><button id="dropBtn">投放食物 ↓</button><button class="direction-button" id="aimRight" aria-label="向右瞄准">→</button>';
    $('#aimLeft').onclick = () => engine.aim(-35); $('#aimRight').onclick = () => engine.aim(35); $('#dropBtn').onclick = () => engine.drop();
  } else if (game === 'shooter') {
    $('#status').textContent = '生命 ♥♥♥♥♥ · 炸弹 3 · 0 秒 · 0 分'; engine = new ShooterGame($('#gameCanvas'), callbacks);
    $('#gameControls').innerHTML = '<button class="direction-button" data-move="-35,0" aria-label="向左飞行">←</button><button class="direction-button" data-move="0,-35" aria-label="向上飞行">↑</button><button id="bombBtn">麦乐鸡炸弹 · 空格</button><button class="direction-button" data-move="0,35" aria-label="向下飞行">↓</button><button class="direction-button" data-move="35,0" aria-label="向右飞行">→</button>';
    $$('[data-move]').forEach(button => { button.onclick = () => engine.nudge(...button.dataset.move.split(',').map(Number)); }); $('#bombBtn').onclick = () => engine.bomb();
  } else {
    mode = 'king'; $('#gameControls').innerHTML = '<button id="kingMode" class="selected" aria-pressed="true">♛ 放置大王</button><button id="markMode" aria-pressed="false">× 画叉排除</button><button id="hintBtn">✦ 逻辑提示</button><button id="clearPuzzle">↺ 清空棋盘</button>';
    $('#kingMode').onclick = () => setMode('king'); $('#markMode').onclick = () => setMode('mark'); $('#hintBtn').onclick = hint;
    $('#clearPuzzle').onclick = () => { if (run.status !== 'playing' || paused) return; show('<span class="modal-label">重新整理</span><h2>清空这一局的棋盘？</h2><p>只清除当前大王与叉号，不重新扣分，题目不变。</p><div class="modal-actions"><button id="confirmClear" class="primary">确认清空棋盘</button><button id="cancelClear" class="secondary">继续保留</button></div>'); $('#cancelClear').onclick = close; $('#confirmClear').onclick = () => { pieces = []; marks = []; hintCell = null; selectedCell = null; renderPuzzle(); close(); }; };
    renderPuzzle(); $('#mission').innerHTML += `<div class="flavors">${puzzleData.flavors.map(f => `<span style="background:${f.color}">${f.id + 1} ${f.name}</span>`).join('')}</div>`;
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
}
function setMode(value) { mode = value; for (const [selector, selected] of [['#kingMode', value === 'king'], ['#markMode', value === 'mark']]) { $(selector).classList.toggle('selected', selected); $(selector).setAttribute('aria-pressed', selected); } }
const same = (a, b) => a?.row === b?.row && a?.col === b?.col;
const cupIcon = artMarkup('food', 4, 'flavor-cup');
const kingIcon = artMarkup('food', 7, 'milkshake-king');

function renderPuzzle() {
  const check = validatePlacements(puzzleData, pieces); $('#status').textContent = `已找到 ${pieces.length} / 9 位大王${check.valid ? '' : ' · 有冲突，请调整'}`;
  $('#puzzleBoard').replaceChildren();
  const region = selectedCell ? puzzleData.regions[selectedCell.row][selectedCell.col] : null;
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    const cell = {row, col}, reg = puzzleData.regions[row][col], flavor = puzzleData.flavors[reg], king = pieces.some(p => same(p, cell)), mark = marks.some(p => same(p, cell));
    const button = document.createElement('button'); button.type = 'button'; button.className = 'cell'; button.style.background = flavor.color; button.style.color = flavor.color; button.dataset.row = row; button.dataset.col = col;
    button.setAttribute('aria-label', `第${row + 1}行第${col + 1}列，${flavor.name}区域${king ? '，大王' : mark ? '，已排除' : '，空格'}`); button.setAttribute('aria-pressed', king || mark);
    button.innerHTML = `<small>${reg + 1}</small>${king ? kingIcon : mark ? '<span class="exclude-mark">×</span>' : cupIcon}`;
    button.classList.toggle('has-king', king); button.classList.toggle('marked', mark); button.classList.toggle('selected-cell', same(selectedCell, cell)); button.classList.toggle('hint', same(hintCell, cell));
    button.classList.toggle('related', !!selectedCell && (row === selectedCell.row || col === selectedCell.col || reg === region)); button.classList.toggle('conflict', check.conflicts.some(p => same(p, cell)));
    button.onclick = () => { if (run.status !== 'playing' || paused) return; selectedCell = cell; hintCell = null; ({pieces, marks} = togglePuzzleCell(pieces, marks, cell, mode)); renderPuzzle(); };
    button.onkeydown = event => { const direction = {ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0]}[event.key]; if (!direction) return; event.preventDefault(); const r = Math.max(0, Math.min(8, row + direction[0])), c = Math.max(0, Math.min(8, col + direction[1])); $(`#puzzleBoard [data-row="${r}"][data-col="${c}"]`).focus(); };
    $('#puzzleBoard').append(button);
  }
  run.puzzle = {...run.puzzle, pieces, marks};
  $('#puzzleFeedback').innerHTML = `<div class="puzzle-progress"><span style="width:${pieces.length / 9 * 100}%"></span></div>${check.valid ? selectedCell ? `已选择第 ${selectedCell.row + 1} 行、第 ${selectedCell.col + 1} 列 · ${puzzleData.flavors[region].name}区域。${mode === 'king' ? '再次点击同格可撤回大王。' : '画叉只表示你的排除判断。'}` : '先从小口味区域开始观察。颜色和数字表示区域；相邻可以放置大王。' : escapeHTML(check.errors[0].message) + ' 红框中的大王发生了冲突，点击可撤回。'}`;
  save(); if (check.complete) end(true);
}
function hint() {
  if (run.status !== 'playing' || paused) return;
  const result = getHint(puzzleData, pieces, marks); hintCell = result.cell || result.cells?.[0] || null; renderPuzzle();
  show(`<span class="modal-label">给你一点灵感</span><h2>这一格，有线索</h2><p>${escapeHTML(result.message)}</p><div class="notice">提示只解释推理，不自动放置。${hintCell ? '回到棋盘后，绿色边框会标出相关位置。' : ''}错误叉号可能排除必需的位置，可先撤回后继续。没有相邻禁令。</div><button class="primary" id="hintClose">回到棋盘定位 →</button>`);
  $('#hintClose').onclick = () => { close(); if (hintCell) $(`#puzzleBoard [data-row="${hintCell.row}"][data-col="${hintCell.col}"]`)?.focus(); };
}
function end(won) {
  if (!run || run.status !== 'playing') return;
  const result = finish(state, run.id, won), score = engine?.score || 0, seconds = Math.floor(engine?.time || engine?.t || 0); const newBest = recordBest(profile, run.game, score);
  if (engine) engine.ended = true; paused = false; modalResume = false; $('#pausedOverlay').hidden = true; $('#pauseBtn').disabled = true; update(); $('#runBadge').textContent = won ? '已通关' : '本局结束';
  show(`<span class="modal-label">${won ? '快乐加一份' : '下局，再来'}</span><div class="result-illustration" aria-hidden="true">${artMarkup(won ? 'flight' : 'food', won ? 7 : 6, 'result-sprite')}</div><h2>${won ? run.game === 'shooter' ? '营救成功，麦麦岛放晴了！' : '漂亮，这局你赢了！' : '就差一点，下局再来！'}</h2><p>${won ? '你的胜利已记录在当前浏览器。' : '本局已结束，入场积分不退还。再次挑战会新扣 88 演示积分。'}</p><div class="result-stats"><div><b>${run.game === 'puzzle' ? pieces.length : score}</b><span>${run.game === 'puzzle' ? '找到的大王 / 9' : newBest ? '本机新纪录' : '本局得分'}</span></div><div><b>${run.game === 'puzzle' ? '唯一解' : seconds + 's'}</b><span>${run.game === 'puzzle' ? '行列口味各一位' : '本局游戏时间'}</span></div><div><b>${state.balance}</b><span>剩余演示积分</span></div></div>${result.reward ? `<div class="coupon"><b>${escapeHTML(result.reward.title)}</b><p>本周期首次获胜已收藏 · 兑换方案需实付 ¥${result.reward.paid}</p><p>演示券，不可真实兑换。${run.game === 'shooter' ? '中薯及 ¥10 门槛仅为未获官方批准的方案建议。' : ''}</p></div>` : won ? '<div class="notice">本周期首胜纪念已收藏，本次通关不重复发券。</div>' : ''}<div class="modal-actions"><button class="primary" id="resultHome">返回大厅 →</button><button class="secondary" id="again">再玩一局 · 88 积分</button></div>`);
  $('#resultHome').onclick = () => { modalResume = false; close(); home(); }; $('#again').onclick = () => { const game = run.game; modalResume = false; startConfirm(game); };
}
function home() { engine?.destroy(); engine = null; paused = false; modalResume = false; $('#home').hidden = false; $('#gameView').hidden = true; $('#pausedOverlay').hidden = true; window.scrollTo({top: 0, behavior: 'smooth'}); update(); }
function requestExit() {
  if (!run || run.status !== 'playing') { home(); return; }
  show(`<span class="modal-label">休息一下</span><h2>要回大厅吗？</h2><p>${run.game === 'puzzle' ? '推理进度会保存，回大厅后可继续，不重复扣分。' : '返回后本局结束，积分不退还。再次开始会重新扣 88 演示积分。'}</p><div class="modal-actions"><button id="reallyExit" class="primary">返回大厅</button><button id="keepPlaying" class="secondary">继续本局</button></div>`);
  $('#reallyExit').onclick = () => { if (run.game !== 'puzzle') finish(state, run.id, false); modalResume = false; close(); home(); };
  $('#keepPlaying').onclick = () => { modalResume = false; close(); pauseGame(false); };
}
$('#exitBtn').onclick = requestExit; $('#pauseExitBtn').onclick = requestExit;
for (const link of $$('.brand, nav a')) link.onclick = event => { if (!$('#gameView').hidden) { event.preventDefault(); requestExit(); } };
$('#pauseBtn').onclick = () => pauseGame(!paused); $('#resumeBtn').onclick = () => pauseGame(false);
$('#retryBtn').onclick = () => startConfirm(run.game, run.status === 'playing' ? run.id : null);
$('#tutorialBtn').onclick = () => tutorial(run.game, false);
document.addEventListener('visibilitychange', () => { if (document.hidden && run?.status === 'playing' && !$('#gameView').hidden && !paused) pauseGame(true); });
$$('[data-start]').forEach(button => { button.onclick = () => { const game = button.dataset.start, pending = game === 'puzzle' ? pendingPuzzle() : null; if (pending) { show(`<span class="modal-label">继续上次的快乐</span><h2>上次的线索，还在等你</h2><p>已找到 ${pending.puzzle.pieces.length} / 9 位大王。继续这局不重新扣分。</p><button id="resumePuzzle" class="primary">继续寻宝 →</button>`); $('#resumePuzzle').onclick = () => { close(); start('puzzle', pending.id); }; } else startConfirm(game); }; });
$$('[data-help]').forEach(button => { button.onclick = () => tutorial(button.dataset.help); });

function resetConfirm() {
  show('<span class="modal-label">从第一局重新开始</span><h2>重置本机演示数据？</h2><p>清空对局、积分流水、首胜纪念和最高分，余额恢复 888。你的预设虚构身份和本机编号会保留。此操作不影响任何真实账户或历史公开快照。</p><div class="modal-actions"><button id="confirmReset" class="primary">确认重置本机演示</button><button id="cancelReset" class="secondary">保留当前数据</button></div>');
  $('#cancelReset').onclick = close; $('#confirmReset').onclick = () => { engine?.destroy(); engine = null; state = fresh(); profile.bests = {merge: 0, shooter: 0}; run = null; modalResume = false; close(); home(); toast('本机演示已重置，快乐重新出发！'); };
}
function wallet() {
  show(`<span class="modal-label">小胜利，大满足</span><h2>我的快乐收藏</h2><p><b>${escapeHTML(profile.name)}</b> · 本机演示身份</p><div class="big-balance">${state.balance} <span>演示积分</span></div><p>数据仅保存在这个浏览器，无真实扣积分、发券或账户连接。</p>${state.coupons.length ? state.coupons.map(coupon => `<div class="coupon"><b>${escapeHTML(coupon.title)}</b><p>兑换方案需实付 ¥${coupon.paid} · 演示券不可兑换</p></div>`).join('') : '<div class="notice">还没有首胜纪念。挑一个游戏，开始收集吧。</div>'}<div class="modal-actions"><button id="recharge" class="primary">演示充值 +440</button><button id="reset" class="secondary">重置演示数据</button></div><p>奖励周期：${state.mode === 'weekly' ? '每周一 00:00' : '每天 00:00'}（Asia/Shanghai），每游戏每周期仅首胜一张。</p><button id="cycleBtn" class="secondary">切换为${state.mode === 'weekly' ? '每日' : '每周'}首胜（演示配置）</button><h3>本机流水</h3>${state.events.slice(0, 15).map(event => `<div class="ledger-row"><span>${escapeHTML(event.label)}</span><b>${event.amount > 0 ? '+' : ''}${event.amount}</b></div>`).join('') || '<p>还没有记录，去开启第一局吧。</p>'}`);
  $('#recharge').onclick = () => { recharge(state, makeDemoId()); update(); wallet(); }; $('#reset').onclick = resetConfirm; $('#cycleBtn').onclick = () => { state.mode = state.mode === 'weekly' ? 'daily' : 'weekly'; update(); wallet(); };
}
function profileDialog() {
  show(`<span class="modal-label">换个快乐分身</span><h2>选一个快乐分身</h2><p>默认虚构身份即可直接试玩，无需登录，不填写姓名、电话或其他个人资料。身份仅保存在本机，与麦当劳会员账户无关。</p><form id="profileForm" class="profile-form"><label for="nickname">预设虚构试玩身份</label><select id="nickname" name="persona">${DEMO_PERSONAS.map(name => `<option value="${name}"${name === profile.name ? ' selected' : ''}>${name}</option>`).join('')}</select><p class="profile-id">本机演示编号 DEMO-${escapeHTML(profile.id.slice(0, 8).toUpperCase())}</p><button class="primary" type="submit">保存快乐分身 →</button></form>`);
  $('#profileForm').onsubmit = event => { event.preventDefault(); const name = $('#nickname').value; if (!DEMO_PERSONAS.includes(name)) return; profile.name = name; update(); close(); toast('预设试玩身份已保存'); };
}
$('#profileBtn').onclick = profileDialog; $('#walletBtn').onclick = wallet; $('#balanceBtn').onclick = wallet; $('#resetDemoBtn').onclick = resetConfirm;
$('#rulesBtn').onclick = () => show('<span class="modal-label">游戏规则</span><h2>快乐规则，明明白白</h2><ul><li>独立非官方游戏原型，演示身份、积分和券均只保存在本机。</li><li>每局确认后扣 88 演示积分，失败不退，积分不足无法开始。钱包可使用明确标注的演示充值。</li><li>每游戏每周期首次获胜记录一张演示券，Asia/Shanghai 每周一或每日 00:00 换周期。</li><li>主推汉堡券需实付 ¥20，麦旋风券需实付 ¥15。营救补给券的中薯及 ¥10 门槛仅为未获官方批准的方案建议。</li><li>上述演示券不可真实兑换，未来奖励不减入当前金额。</li><li>刷新不重复扣分或发奖励；飞行和合成刷新后结束，推理可免费续玩。</li><li>真实能力仅为附带的官方公开活动历史快照，不实时查询。未接入真实游戏扣分或发券接口，不用官方抽奖或商城兑换代替。</li><li>9×9 推理只有每行、每列、每口味区域各一位，没有相邻禁令。</li><li>游戏场景与角色使用 AI 生成的原创图片，不是官方游戏或官方角色素材；大厅场景为装饰。</li></ul>');
update();
async function prepareArt() {
  artLoadFailed = false; $('#retryArt').hidden = true; $('#artNotice').hidden = false; $('#artNoticeText').textContent = '快乐素材准备中…';
  try { await loadGameArt(); $('#heroImage').src = ART_FILES.stage; $('#heroCharacters').innerHTML = artMarkup('food', 6, 'hero-burger') + artMarkup('food', 7, 'hero-king') + artMarkup('flight', 0, 'hero-ship'); $$('[data-art]').forEach(canvas => drawArt(canvas, canvas.dataset.art)); $('#artNotice').hidden = true; update(); }
  catch { artLoadFailed = true; $('#artNoticeText').textContent = '游戏图片没能加载，重试后再开玩。'; $('#retryArt').hidden = false; update(); }
}
$('#retryArt').onclick = prepareArt;
prepareArt();
if (interrupted.length) toast('上次的飞行 / 合成对局已结束，未重复扣分。推理进度仍可继续。');
if (storageWarning) $('#storageNotice').hidden = false;
