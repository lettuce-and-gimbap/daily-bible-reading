import {BOUNDS} from './camera.js';
// 같은 월드의 표시 목록을 바꿔도 인물 객체와 실행 중 이동 상태를 재사용한다.
export const castKey = (p) => `${p.name}:${p.identity?.id || (p.refs || []).join('|')}`;
export function reconcileCast(current, desired, cache, create) {
  for (const n of current) cache.set(castKey(n), n);
  const next = desired.map((person, i) => {
    const key = castKey(person);
    if (!cache.has(key)) cache.set(key, create(person, i, current));
    return cache.get(key);
  });
  current.splice(0, current.length, ...next);
  return current;
}
export function findSpawnCell(npcs, blocked, random = Math.random) {
  const free = [];
  for (let y = BOUNDS.minY; y <= BOUNDS.maxY; y++) for (let x = BOUNDS.minX; x <= BOUNDS.maxX; x++) {
    if (!blocked(x, y) && !npcs.some(n => Math.hypot(n.x-x,n.y-y) < 2 || n.path?.some(p=>p.x===x&&p.y===y))) free.push({x,y});
  }
  return free[Math.min(free.length-1, Math.floor(random()*free.length))] || null;
}
