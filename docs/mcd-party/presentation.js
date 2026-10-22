// Presentation only: no booking, price calculation or remote queries.
export const THEME_IMAGES = Object.freeze({
  birthday: 'assets/party-birthday-v2.png',
  friends: 'assets/party-friends-v2.png',
  interest: 'assets/party-interest-v2.png'
});
export function themeImage(id) {
  return THEME_IMAGES[id] || THEME_IMAGES.birthday;
}
export function agendaClock(start, offset) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^\d{2}:[0-5]\d$/.test(offset)) return '';
  const [h, m] = start.split(':').map(Number);
  const [oh, om] = offset.split(':').map(Number);
  const duration = oh * 60 + om;
  if (duration > 360) return '';
  const total = h * 60 + m + duration;
  const clock = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  return `${total >= 1440 ? '次日 ' : ''}${clock}`;
}
