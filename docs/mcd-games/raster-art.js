/** Original raster renderer. Source rectangles trim transparent gutters; image bytes stay intact. */
export const ART_FILES = {
  food: 'assets/game-food-atlas-v2.png',
  flight: 'assets/game-shooter-atlas-v2.png',
  stage: 'assets/game-stage-v2.png'
};
const pictures = new Map();
let loading;
// Alpha > 128 bounds measured on the final 1774 × 887 atlases. Eight pixels
// of breathing room retain antialiased edges; every frame remains in its cell.
const SOURCE_SIZE = {width: 1774, height: 887};
const SPRITE_BOUNDS = {
  food: [[152,114,151,281],[577,100,191,298],[965,165,302,222],[1438,112,239,286],[114,510,221,282],[517,526,297,272],[966,539,294,248],[1460,501,196,295]],
  flight: [[60,111,327,309],[504,176,328,186],[935,121,341,275],[1381,103,344,322],[142,502,163,310],[559,519,210,261],[984,571,252,202],[1431,541,241,228]]
};
export function atlasCell(width, height, index, columns = 4, rows = 2) {
  if (![width, height, columns, rows].every(n => Number.isInteger(n) && n > 0) || !Number.isInteger(index) || index < 0 || index >= columns * rows) throw new RangeError('无效的美术图集位置');
  const x = Math.floor(index % columns * width / columns), y = Math.floor(Math.floor(index / columns) * height / rows);
  return {x, y, width: Math.floor((index % columns + 1) * width / columns) - x, height: Math.floor((Math.floor(index / columns) + 1) * height / rows) - y};
}
export function spriteFrame(set, index, width = SOURCE_SIZE.width, height = SOURCE_SIZE.height) {
  const cell = atlasCell(width, height, index);
  if (!Object.hasOwn(SPRITE_BOUNDS, set)) throw new RangeError('无效的美术图集位置');
  const [left, top, w, h] = SPRITE_BOUNDS[set][index], sx = width / SOURCE_SIZE.width, sy = height / SOURCE_SIZE.height;
  const x = Math.max(cell.x, Math.floor((left - 8) * sx)), y = Math.max(cell.y, Math.floor((top - 8) * sy));
  const right = Math.min(cell.x + cell.width, Math.ceil((left + w + 8) * sx)), bottom = Math.min(cell.y + cell.height, Math.ceil((top + h + 8) * sy));
  return {x, y, width: right - x, height: bottom - y};
}
export function loadGameArt(ImageClass = globalThis.Image) {
  if (loading) return loading;
  if (typeof ImageClass !== 'function') return Promise.reject(new Error('当前环境无法加载游戏图片'));
  loading = Promise.all(Object.entries(ART_FILES).map(([name, src]) => new Promise((resolve, reject) => {
    if (pictures.has(name)) return resolve();
    const picture = new ImageClass();
    picture.onload = () => { if (!picture.naturalWidth || !picture.naturalHeight) return reject(new Error('游戏图片内容无效')); pictures.set(name, picture); resolve(); };
    picture.onerror = () => reject(new Error('游戏图片加载失败，请重试'));
    picture.src = src;
  }))).catch(error => { loading = undefined; throw error; });
  return loading;
}
export function artReady() { return Object.keys(ART_FILES).every(name => pictures.has(name)); }
export function sprite(ctx, set, index, x, y, width, height = width, angle = 0) {
  const picture = pictures.get(set); if (!picture) return false;
  const cell = spriteFrame(set, index, picture.naturalWidth, picture.naturalHeight);
  const scale = Math.min(width / cell.width, height / cell.height), w = cell.width * scale, h = cell.height * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.drawImage(picture, cell.x, cell.y, cell.width, cell.height, -w / 2, -h / 2, w, h); ctx.restore(); return true;
}
export function stage(ctx, width, height, opacity = 1) {
  const picture = pictures.get('stage'); if (!picture) return false;
  const scale = Math.max(width / picture.naturalWidth, height / picture.naturalHeight), w = picture.naturalWidth * scale, h = picture.naturalHeight * scale;
  ctx.save(); ctx.globalAlpha = opacity; ctx.drawImage(picture, (width - w) / 2, (height - h) / 2, w, h); ctx.restore(); return true;
}
export function artMarkup(set, index, className = '') {
  if (!['food', 'flight'].includes(set) || !Number.isInteger(index) || index < 0 || index > 7) throw new RangeError('无效的美术图集位置');
  const frame = spriteFrame(set, index), ratio = frame.width / frame.height;
  const style = `width:${Math.min(1, ratio) * 100}%;height:${Math.min(1, 1 / ratio) * 100}%;background-size:${SOURCE_SIZE.width / frame.width * 100}% ${SOURCE_SIZE.height / frame.height * 100}%;background-position:${frame.x / (SOURCE_SIZE.width - frame.width) * 100}% ${frame.y / (SOURCE_SIZE.height - frame.height) * 100}%`;
  return `<span class="atlas-sprite ${className}" data-atlas="${set}" style="--sprite-col:${index % 4};--sprite-row:${Math.floor(index / 4)}" aria-hidden="true"><span class="atlas-image" style="${style}"></span></span>`;
}
