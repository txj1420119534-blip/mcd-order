/** Local presentation state only. The points/reward ledger stays in ledger.js. */
export const DEMO_PERSONAS = ['试玩体验官', '星际厨师', '奶昔侦探', '快乐飞行员'];
let localIdSequence = 0;
/** This identifier is for local demo records, never authentication or credentials. */
export function makeDemoId(cryptoApi = globalThis.crypto, now = Date.now, rng = Math.random) {
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  localIdSequence++;
  return `demo-${now().toString(36)}-${Math.floor(rng() * 0x100000000).toString(36)}-${localIdSequence.toString(36)}`;
}
export function createProfile(id = 'local-player') {
  return {id: String(id).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 48) || 'local-player', name: DEMO_PERSONAS[0], bests: {merge: 0, shooter: 0}, tutorialSeen: {}};
}

export function restoreProfile(raw, fallbackId) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,48}$/.test(value.id)) throw Error();
    if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 16) throw Error();
    const profile = createProfile(value.id);
    profile.name = DEMO_PERSONAS.includes(value.name) ? value.name : DEMO_PERSONAS[0];
    for (const game of ['merge', 'shooter']) if (Number.isSafeInteger(value.bests?.[game]) && value.bests[game] >= 0) profile.bests[game] = value.bests[game];
    for (const game of ['merge', 'shooter', 'puzzle']) if (value.tutorialSeen?.[game] === true) profile.tutorialSeen[game] = true;
    return profile;
  } catch { return createProfile(fallbackId); }
}

export function recordBest(profile, game, score) {
  if (!['merge', 'shooter'].includes(game) || !Number.isSafeInteger(score) || score < 0) return false;
  const improved = score > profile.bests[game];
  profile.bests[game] = Math.max(profile.bests[game], score);
  return improved;
}

export function togglePuzzleCell(pieces, marks, cell, mode = 'king') {
  if (!Number.isInteger(cell?.row) || !Number.isInteger(cell?.col) || cell.row < 0 || cell.row > 8 || cell.col < 0 || cell.col > 8) throw Error('无效棋盘位置');
  if (!['king', 'mark'].includes(mode)) throw Error('无效操作模式');
  const same = p => p.row === cell.row && p.col === cell.col;
  const target = mode === 'king' ? pieces : marks;
  const next = target.some(same) ? target.filter(p => !same(p)) : [...target, {row: cell.row, col: cell.col}];
  return mode === 'king' ? {pieces: next, marks: marks.filter(p => !same(p))} : {pieces: pieces.filter(p => !same(p)), marks: next};
}

export function settleInterruptedRuns(state, finishRun) {
  const interrupted = [];
  for (const run of Object.values(state.runs)) {
    if (run.status === 'playing' && run.game !== 'puzzle') {
      finishRun(state, run.id, false);
      interrupted.push(run.id);
    }
  }
  return interrupted;
}
