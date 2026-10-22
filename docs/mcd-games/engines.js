import {sprite, stage, artReady} from './raster-art.js';
export const FOOD=['圆筒','可乐','派','薯条','麦旋风','麦辣鸡翅','当季主推汉堡'];
export function food(ctx, level, x, y, r, angle = 0) { return sprite(ctx, 'food', level, x, y, r * 2.2, r * 2.2, angle); }
export function nugget(ctx, x, y, r) { return sprite(ctx, 'flight', 5, x, y, r * 3, r * 3); }
export function rescueTarget(ctx, x, y) { return sprite(ctx, 'food', 7, x, y, 88, 88); }
export function drawArt(canvas, type) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h);
  if (!artReady()) return;
  stage(c, w, h);
  c.save(); c.fillStyle = type === 'shooter' ? '#17415c33' : type === 'puzzle' ? '#44236325' : '#ffd74b33'; c.fillRect(0, 0, w, h);
  if (type === 'merge' || type === 'hero') {
    food(c, 3, w * .22, h * .58, h * .28, -.15);
    food(c, 1, w * .76, h * .53, h * .28, .12);
    food(c, 6, w * .49, h * .62, h * .42);
    food(c, 0, w * .49, h * .21, h * .16, -.12);
  } else if (type === 'shooter') {
    sprite(c, 'flight', 1, w * .19, h * .3, h * .45);
    sprite(c, 'flight', 2, w * .82, h * .27, h * .4);
    sprite(c, 'flight', 0, w * .5, h * .62, h * 1.05);
    sprite(c, 'flight', 6, w * .83, h * .73, h * .25);
  } else {
    food(c, 4, w * .21, h * .67, h * .21, -.12);
    food(c, 4, w * .8, h * .65, h * .21, .12);
    sprite(c, 'food', 7, w * .5, h * .53, h * 1.2);
  }
  c.restore();
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const random = (a, b) => a + Math.random() * (b - a);
const rounded = (c, x, y, w, h, radius, color) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill(); };
const line = (c, x1, y1, x2, y2, color, width = 2) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };

function burst(particles, x, y, color, count = 18) {
  for (let i = 0; i < count; i++) { const a = random(0, Math.PI * 2), speed = random(50, 210); particles.push({x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: random(.3, .8), max: .8, size: random(3, 8), color}); }
}
function animateParticles(particles, dt) {
  for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
  return particles.filter(p => p.life > 0);
}
function paintParticles(c, particles) {
  for (const p of particles) { c.save(); c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x, p.y); c.rotate(p.life * 4); rounded(c, -p.size / 2, -p.size / 2, p.size, p.size, 2, p.color); c.restore(); }
}
function drone(c, x, y, boss = false, hit = false) {
  c.save(); c.globalAlpha = hit ? .55 : 1;
  sprite(c, 'flight', boss ? 3 : 1, x, y, boss ? 164 : 76, boss ? 164 : 76);
  c.restore();
}
function player(c, x, y, t) { sprite(c, 'flight', 0, x, y, 102, 102, Math.sin(t * 2) * .025); }

class CanvasGame {
  listen(target, type, handler, options) { target.addEventListener(type, handler, options); this.listeners.push([target, type, handler, options]); }
  setPaused(value) { this.paused = value; this.keys.clear(); this.dragging = false; }
  conclude(won) { if (this.ended) return; this.ended = true; this.keys.clear(); this.cb.end(won); }
  destroy() { cancelAnimationFrame(this.frame); for (const [target, type, handler, options] of this.listeners) target.removeEventListener(type, handler, options); this.listeners = []; }
}

export class MergeGame extends CanvasGame {
  constructor(canvas, callbacks) {
    super(); this.c = canvas; this.ctx = canvas.getContext('2d'); this.cb = callbacks; this.balls = []; this.particles = []; this.floaters = []; this.score = 0; this.next = 0; this.x = 240; this.cool = 0; this.time = 0; this.danger = 0; this.paused = false; this.ended = false; this.dragging = false; this.keys = new Set(); this.listeners = [];
    const point = e => { const rect = canvas.getBoundingClientRect(); this.x = clamp((e.clientX - rect.left) / rect.width * 480, 45, 435); };
    this.listen(canvas, 'pointerdown', e => { if (this.paused || this.ended) return; e.preventDefault(); point(e); this.dragging = true; canvas.setPointerCapture?.(e.pointerId); });
    this.listen(canvas, 'pointermove', e => { if (!this.paused && !this.ended) point(e); });
    this.listen(canvas, 'pointerup', e => { if (!this.dragging) return; e.preventDefault(); point(e); this.dragging = false; this.drop(); });
    this.listen(canvas, 'pointercancel', () => { this.dragging = false; });
    this.listen(window, 'keydown', e => { if (this.paused || this.ended || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return; if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); this.keys.add(e.key); if (!e.repeat && (e.key === ' ' || e.key === 'ArrowDown')) this.drop(); } });
    this.listen(window, 'keyup', e => this.keys.delete(e.key));
    this.listen(window, 'blur', () => this.keys.clear());
    this.last = performance.now(); this.loop = this.loop.bind(this); this.frame = requestAnimationFrame(this.loop);
  }
  aim(delta) { if (!this.paused && !this.ended) this.x = clamp(this.x + delta, 45, 435); }
  drop() {
    if (this.paused || this.ended || this.cool > 0) return false;
    const l = this.next, r = 20 + l * 7;
    this.balls.push({x: clamp(this.x, 20 + r, 460 - r), y: 65, r, l, vx: 0, vy: 0, age: 0});
    this.next = Math.random() < .5 ? 0 : Math.random() < .65 ? 1 : 2; this.cool = .55;
    this.cb.status(`合成积分 ${this.score} · 下一个：${FOOD[this.next]}`); return true;
  }
  loop(now) { const dt = Math.min((now - this.last) / 1000, .034); this.last = now; if (!this.paused && !this.ended) for (let i = 0; i < 3; i++) this.update(dt / 3); this.draw(); this.frame = requestAnimationFrame(this.loop); }
  update(dt) {
    if (this.paused || this.ended) return;
    this.cool = Math.max(0, this.cool - dt); this.time += dt; this.particles = animateParticles(this.particles, dt);
    for (const f of this.floaters) { f.life -= dt; f.y -= 45 * dt; } this.floaters = this.floaters.filter(f => f.life > 0);
    if (this.keys.has('ArrowLeft')) this.aim(-250 * dt); if (this.keys.has('ArrowRight')) this.aim(250 * dt);
    for (const b of this.balls) {
      b.age += dt; b.vy += 700 * dt; b.vx *= Math.pow(.99, dt * 60); b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r + 20) { b.x = b.r + 20; b.vx = Math.abs(b.vx) * .3; }
      if (b.x > 460 - b.r) { b.x = 460 - b.r; b.vx = -Math.abs(b.vx) * .3; }
      if (b.y > 645 - b.r) { b.y = 645 - b.r; b.vy = -Math.abs(b.vy) * .15; if (Math.abs(b.vy) < 12) b.vy = 0; b.vx *= .98; }
    }
    for (let iteration = 0; iteration < 6; iteration++) for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
      const a = this.balls[i], b = this.balls[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, overlap = a.r + b.r - d;
      if (overlap <= 0) continue;
      if (a.l === b.l) {
        const l = a.l + 1, points = 2 ** l * 10, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2; this.score += points;
        burst(this.particles, x, y, '#ffcf3d', 22); burst(this.particles, x, y, '#d8312b', 7); this.floaters.push({x, y, text: `+${points} ${FOOD[l]}`, life: 1.2});
        this.cb.status(`合成积分 ${this.score} · 合出${FOOD[l]}！`);
        this.balls.splice(j, 1); this.balls.splice(i, 1); this.balls.push({x, y, l, r: 20 + l * 7, vx: (a.vx + b.vx) / 2, vy: -75, age: 0});
        if (l === 6) this.conclude(true); return;
      }
      const nx = dx / d, ny = dy / d, ma = a.r * a.r, mb = b.r * b.r;
      a.x -= nx * overlap * mb / (ma + mb); a.y -= ny * overlap * mb / (ma + mb); b.x += nx * overlap * ma / (ma + mb); b.y += ny * overlap * ma / (ma + mb);
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative < 0) { const impulse = -relative * 1.1 / (1 / ma + 1 / mb); a.vx -= impulse * nx / ma; a.vy -= impulse * ny / ma; b.vx += impulse * nx / mb; b.vy += impulse * ny / mb; }
    }
    const high = this.balls.some(b => b.age > 2 && b.y - b.r < 105 && Math.abs(b.vy) < 40); this.danger = high ? this.danger + dt : Math.max(0, this.danger - dt * 2); if (this.danger > 3) this.conclude(false);
  }
  draw() {
    const c = this.ctx; c.clearRect(0, 0, 480, 680); stage(c, 480, 680);
    rounded(c, 13, 97, 454, 559, 20, '#8d432837'); rounded(c, 19, 105, 442, 540, 16, '#fffbf0ec');
    c.strokeStyle = '#fff7d5'; c.lineWidth = 7; c.beginPath(); c.roundRect(18, 103, 444, 545, 16); c.stroke();
    c.setLineDash([8, 7]); line(c, 24, 105, 456, 105, this.danger ? '#d8312b' : '#c48f64', 2); c.setLineDash([]);
    c.fillStyle = this.danger ? '#b52120' : '#8a6644'; c.font = '12px system-ui'; c.textAlign = 'center'; c.fillText(this.danger ? `装满警报 · ${(3 - Math.min(3, this.danger)).toFixed(1)} 秒` : '同款碰一碰，美味升一级', 240, 127);
    c.globalAlpha = .5; c.setLineDash([4, 7]); line(c, this.x, 72, this.x, 635, '#ca8f58', 1); c.setLineDash([]); c.globalAlpha = 1;
    for (const b of this.balls) { c.fillStyle = '#8d562215'; c.beginPath(); c.ellipse(b.x, b.y + b.r * .75, b.r * .7, 6, 0, 0, Math.PI * 2); c.fill(); food(c, b.l, b.x, b.y, b.r * .91, Math.min(.16, b.vx / 500)); }
    if (!this.ended) { food(c, this.next, this.x, 49, 20 + this.next * 7); c.fillStyle = '#785337'; c.font = 'bold 11px system-ui'; c.fillText(this.cool > 0 ? '准备下一份…' : this.dragging ? '松手投放 ↓' : '拖动瞄准 · 松手投放', 240, 88); }
    paintParticles(c, this.particles);
    for (const f of this.floaters) { c.save(); c.globalAlpha = Math.min(1, f.life); c.fillStyle = '#a92321'; c.font = 'bold 20px system-ui'; c.fillText(f.text, f.x, f.y); c.restore(); }
    rounded(c, 33, 652, 414, 22, 7, '#d8312b'); c.fillStyle = '#fffaf1'; c.font = 'bold 11px system-ui'; c.fillText('目标：合出当季主推汉堡', 240, 667); c.textAlign = 'left';
  }
}

export class ShooterGame extends CanvasGame {
  constructor(canvas, callbacks) {
    super(); this.c = canvas; this.ctx = canvas.getContext('2d'); this.cb = callbacks; this.x = 240; this.y = 580; this.health = 5; this.bombs = 3; this.weapon = 'cola'; this.weaponTime = 0; this.t = 0; this.shot = 0; this.spawn = 0; this.enemies = []; this.bullets = []; this.shots = []; this.pickups = []; this.particles = []; this.floaters = []; this.score = 0; this.kills = 0; this.inv = 0; this.flash = 0; this.keys = new Set(); this.listeners = []; this.boss = null; this.ended = false; this.paused = false; this.dragging = false;
    this.listen(canvas, 'pointerdown', e => { if (this.paused || this.ended) return; this.dragging = true; canvas.setPointerCapture?.(e.pointerId); this.move(e); });
    this.listen(canvas, 'pointermove', e => { if (this.dragging) this.move(e); });
    this.listen(canvas, 'pointerup', () => { this.dragging = false; }); this.listen(canvas, 'pointercancel', () => { this.dragging = false; });
    this.listen(window, 'keydown', e => { if (this.paused || this.ended || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 's', 'w', 'd'].includes(e.key)) { e.preventDefault(); this.keys.add(e.key); if (!e.repeat && e.key === ' ') this.bomb(); } });
    this.listen(window, 'keyup', e => this.keys.delete(e.key)); this.listen(window, 'blur', () => this.keys.clear()); this.last = performance.now(); this.loop = this.loop.bind(this); this.frame = requestAnimationFrame(this.loop);
  }
  move(e) { if (this.paused || this.ended) return; e.preventDefault(); const r = this.c.getBoundingClientRect(); this.x = clamp((e.clientX - r.left) / r.width * 480, 30, 450); this.y = clamp((e.clientY - r.top) / r.height * 680, 220, 635); }
  nudge(dx, dy) { if (!this.paused && !this.ended) { this.x = clamp(this.x + dx, 30, 450); this.y = clamp(this.y + dy, 220, 635); } }
  bomb() { if (this.bombs <= 0 || this.ended || this.paused) return false; this.bombs--; this.bullets = []; for (const e of this.enemies) { e.hp -= 5; burst(this.particles, e.x, e.y, '#ffcf3d', 16); } if (this.boss) this.boss.hp -= 14; this.flash = .3; burst(this.particles, this.x, this.y - 80, '#fff1ac', 45); this.report(); return true; }
  report() { this.cb.status(`生命 ${'♥'.repeat(Math.max(0, this.health))} · 炸弹 ${this.bombs} · ${Math.floor(this.t)} 秒 · ${this.score} 分`); }
  loop(now) { const dt = Math.min(.034, (now - this.last) / 1000); this.last = now; if (!this.paused && !this.ended) this.update(dt); this.draw(); this.frame = requestAnimationFrame(this.loop); }
  update(dt) {
    if (this.paused || this.ended) return;
    const old = Math.floor(this.t); this.t += dt; this.inv = Math.max(0, this.inv - dt); this.flash = Math.max(0, this.flash - dt); this.particles = animateParticles(this.particles, dt); for (const f of this.floaters) { f.life -= dt; f.y -= 30 * dt; } this.floaters = this.floaters.filter(f => f.life > 0);
    if (Math.floor(this.t) !== old) this.report(); const k = this.keys;
    this.nudge((k.has('ArrowRight') || k.has('d') ? 270 * dt : 0) - (k.has('ArrowLeft') || k.has('a') ? 270 * dt : 0), (k.has('ArrowDown') || k.has('s') ? 270 * dt : 0) - (k.has('ArrowUp') || k.has('w') ? 270 * dt : 0));
    this.weaponTime -= dt; if (this.weaponTime < 0) this.weapon = 'cola'; this.shot -= dt;
    if (this.shot <= 0) { this.shot = this.weapon === 'mortar' ? .38 : .16; if (this.weapon === 'missile') for (const a of [-.22, 0, .22]) this.shots.push({x: this.x, y: this.y - 20, vx: a * 300, vy: -480, r: 5, damage: 2, kind: 'missile'}); else this.shots.push({x: this.x, y: this.y - 20, vx: 0, vy: this.weapon === 'mortar' ? -350 : -600, r: this.weapon === 'mortar' ? 13 : 4, damage: this.weapon === 'mortar' ? 6 : 1, kind: this.weapon}); }
    this.spawn -= dt; if (this.t < 58 && this.spawn <= 0) { this.spawn = Math.max(.45, 1.4 - this.t * .012); this.enemies.push({x: 35 + Math.random() * 410, y: -25, hp: 2 + Math.floor(this.t / 25), age: 0, phase: Math.random() * 6, fire: .8 + Math.random(), r: 18, hit: 0}); }
    if (this.t >= 58 && !this.boss) { this.boss = {x: 240, y: 90, hp: 160, max: 160, fire: 1, age: 0}; this.cb.notice('首领出现！击破乌云守卫，完成营救。'); }
    if (old !== Math.floor(this.t) && [8, 18, 28, 38, 48, 65, 78].includes(Math.floor(this.t))) this.pickups.push({x: 90 + Math.random() * 300, y: -20, kind: ['missile', 'mortar', 'bomb'][Math.floor(this.t / 10) % 3]});
    for (const e of this.enemies) { e.age += dt; e.hit = Math.max(0, (e.hit || 0) - dt); e.y += 75 * dt; e.x += Math.sin(e.age * 2 + e.phase) * 30 * dt; e.fire -= dt; if (e.fire < 0 && e.y < 500) { e.fire = 1.9; const dx = this.x - e.x, dy = this.y - e.y, len = Math.hypot(dx, dy) || 1; this.bullets.push({x: e.x, y: e.y, vx: dx / len * 120, vy: dy / len * 120, r: 6}); } if (Math.hypot(e.x - this.x, e.y - this.y) < 35) { this.hit(); e.hp = 0; } }
    if (this.ended) return;
    if (this.boss) { const b = this.boss; b.age += dt; b.x = 240 + Math.sin(b.age * .8) * 150; b.fire -= dt; b.hit = Math.max(0, (b.hit || 0) - dt); if (b.fire < 0) { b.fire = .8; for (let i = -2; i <= 2; i++) { const a = i * .27 + Math.sin(b.age) * .12; this.bullets.push({x: b.x, y: b.y + 30, vx: Math.sin(a) * 170, vy: Math.cos(a) * 170, r: 7}); } } }
    for (const shot of this.shots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; let consumed = false;
      for (const e of this.enemies) if (e.hp > 0 && Math.hypot(e.x - shot.x, e.y - shot.y) < e.r + shot.r) { e.hp -= shot.damage; e.hit = .1; burst(this.particles, e.x, e.y, '#ffcf3d', 5); if (shot.kind === 'mortar') { for (const other of this.enemies) if (Math.hypot(other.x - e.x, other.y - e.y) < 90) other.hp -= 3; burst(this.particles, e.x, e.y, '#f48e59', 20); } consumed = true; break; }
      if (!consumed && this.boss && Math.hypot(this.boss.x - shot.x, this.boss.y - shot.y) < 44 + shot.r) { this.boss.hp -= shot.damage; this.boss.hit = .08; burst(this.particles, shot.x, shot.y, '#fff1ac', 5); consumed = true; }
      if (consumed) shot.y = -100;
    }
    for (const e of this.enemies) if (e.hp <= 0 && !e.counted) { e.counted = true; this.kills++; this.score += 100; burst(this.particles, e.x, e.y, '#ffcf3d', 17); this.floaters.push({x: e.x, y: e.y, text: '+100', life: .8}); }
    if (this.boss?.hp <= 0) { this.score += 2000; burst(this.particles, this.boss.x, this.boss.y, '#ffcf3d', 60); this.report(); this.conclude(true); return; }
    for (const b of this.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.hypot(b.x - this.x, b.y - this.y) < 15 + b.r) { this.hit(); b.y = 999; } } if (this.ended) return;
    for (const p of this.pickups) { p.y += 90 * dt; if (Math.hypot(p.x - this.x, p.y - this.y) < 35) { if (p.kind === 'bomb') this.bombs = Math.min(5, this.bombs + 1); else { this.weapon = p.kind; this.weaponTime = 13; } this.cb.notice(p.kind === 'bomb' ? '麦乐鸡炸弹 +1' : p.kind === 'missile' ? '麦旋风三向导弹 · 13 秒' : '汉堡迫击炮 · 范围伤害 13 秒'); burst(this.particles, p.x, p.y, '#a5e7bf', 16); p.y = 999; this.report(); } }
    this.enemies = this.enemies.filter(e => e.hp > 0 && e.y < 720); this.shots = this.shots.filter(s => s.y > -30 && s.x > -30 && s.x < 510); this.bullets = this.bullets.filter(b => b.y < 710 && b.x > -30 && b.x < 510); this.pickups = this.pickups.filter(p => p.y < 720);
  }
  hit() { if (this.inv > 0 || this.ended || this.paused) return; this.health--; this.inv = 1.5; burst(this.particles, this.x, this.y, '#ff8c83', 15); this.report(); if (this.health <= 0) this.conclude(false); }
  draw() {
    const c = this.ctx; c.clearRect(0, 0, 480, 680); stage(c, 480, 680);
    c.fillStyle = '#173a58a6'; c.fillRect(0, 0, 480, 680);
    c.save(); c.globalAlpha = this.boss ? .8 : .4; rescueTarget(c, 431, 82); c.restore();
    c.fillStyle = '#fff4c6'; c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.fillText('等待营救', 430, 133);
    for (const s of this.shots) { if (s.kind === 'mortar') food(c, 6, s.x, s.y, 15, this.t * 3); else if (s.kind === 'missile') { line(c, s.x, s.y + 20, s.x - s.vx / 30, s.y + 36, '#e7b8ff', 3); food(c, 4, s.x, s.y, 10); } else { c.shadowColor = '#ff9271'; c.shadowBlur = 8; rounded(c, s.x - 3, s.y - 12, 6, 25, 3, '#ffcf3d'); c.shadowBlur = 0; } }
    for (const e of this.enemies) drone(c, e.x, e.y, false, e.hit > 0);
    if (this.boss) { drone(c, this.boss.x, this.boss.y, true, this.boss.hit > 0); rounded(c, 35, 20, 330, 10, 5, '#0e1c2c'); rounded(c, 35, 20, Math.max(0, this.boss.hp / this.boss.max * 330), 10, 5, '#f78376'); c.fillStyle = '#fffaf1'; c.font = 'bold 11px system-ui'; c.textAlign = 'left'; c.fillText('乌云守卫 · 击破即可完成营救', 35, 48); }
    else { rounded(c, 25, 21, 330, 7, 4, '#0e1c2c'); rounded(c, 25, 21, Math.min(1, this.t / 58) * 330, 7, 4, '#ffcf3d'); c.fillStyle = '#bdd7e7'; c.font = '11px system-ui'; c.textAlign = 'left'; c.fillText(`前往营救点 · 首领将在 ${Math.max(0, Math.ceil(58 - this.t))} 秒后出现`, 25, 47); }
    for (const b of this.bullets) sprite(c, 'flight', 4, b.x, b.y, b.r * 4, b.r * 4, Math.atan2(b.vy, b.vx) + Math.PI / 2);
    for (const p of this.pickups) { rounded(c, p.x - 24, p.y - 26, 48, 50, 12, '#fffaf1'); line(c, p.x - 20, p.y - 26, p.x, p.y - 40, '#ddedf5', 2); line(c, p.x + 20, p.y - 26, p.x, p.y - 40, '#ddedf5', 2); p.kind === 'bomb' ? nugget(c, p.x, p.y - 2, 15) : food(c, p.kind === 'missile' ? 4 : 6, p.x, p.y - 2, 18); c.fillStyle = '#fffaf1'; c.font = '10px system-ui'; c.textAlign = 'center'; c.fillText(p.kind === 'bomb' ? '炸弹补给' : p.kind === 'missile' ? '三向导弹' : '范围迫击炮', p.x, p.y + 39); }
    paintParticles(c, this.particles); for (const f of this.floaters) { c.fillStyle = '#ffcf3d'; c.globalAlpha = Math.min(1, f.life * 2); c.font = 'bold 17px system-ui'; c.textAlign = 'center'; c.fillText(f.text, f.x, f.y); } c.globalAlpha = 1;
    if (this.inv <= 0 || Math.floor(this.t * 12) % 2) player(c, this.x, this.y, this.t);
    if (this.flash > 0) { c.fillStyle = '#fff3bf'; c.globalAlpha = this.flash * 1.7; c.fillRect(0, 0, 480, 680); c.globalAlpha = 1; }
    rounded(c, 18, 643, 444, 26, 10, '#0d1b2f'); c.fillStyle = '#c9e1ed'; c.font = 'bold 11px system-ui'; c.textAlign = 'center'; const weaponName = {cola: '可乐激光 · 自动开火', missile: '麦旋风三向导弹', mortar: '汉堡范围迫击炮'}[this.weapon]; c.fillText(`${weaponName}${this.weapon !== 'cola' ? ' · ' + Math.max(0, Math.ceil(this.weaponTime)) + '秒' : ''}`, 240, 660); c.textAlign = 'left';
  }
}
