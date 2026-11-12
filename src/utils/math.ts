/* src/utils/math.ts */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const normalizeAngle = (rad: number): number => {
  while (rad <= -Math.PI) rad += 2 * Math.PI;
  while (rad > Math.PI) rad -= 2 * Math.PI;
  return rad;
};

export const angleBetween = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.atan2(y2 - y1, x2 - x1);

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
};

export const distanceSq = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export interface Vec2 {
  x: number;
  y: number;
}

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });

export const vec2Add = (a: Vec2, b: Vec2): Vec2 => vec2(a.x + b.x, a.y + b.y);
export const vec2Sub = (a: Vec2, b: Vec2): Vec2 => vec2(a.x - b.x, a.y - b.y);
export const vec2Mul = (a: Vec2, s: number): Vec2 => vec2(a.x * s, a.y * s);
export const vec2Div = (a: Vec2, s: number): Vec2 => vec2(a.x / s, a.y / s);
export const vec2Len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const vec2LenSq = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const vec2Normalize = (a: Vec2): Vec2 => {
  const len = vec2Len(a);
  return len > 0 ? vec2(a.x / len, a.y / len) : vec2(0, 0);
};
export const vec2SetLength = (a: Vec2, len: number): Vec2 => vec2Mul(vec2Normalize(a), len);
export const vec2Angle = (a: Vec2): number => Math.atan2(a.y, a.x);
export const vec2FromAngle = (angle: number, length = 1): Vec2 => vec2(Math.cos(angle) * length, Math.sin(angle) * length);
export const vec2Lerp = (a: Vec2, b: Vec2, t: number): Vec2 => vec2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
export const vec2Clamp = (a: Vec2, maxLen: number): Vec2 => {
  const lenSq = vec2LenSq(a);
  if (lenSq > maxLen * maxLen) return vec2SetLength(a, maxLen);
  return a;
};

export const randomInRange = (min: number, max: number): number => Math.random() * (max - min) + min;

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export const sign = (n: number): number => (n > 0 ? 1 : n < 0 ? -1 : 0);

export const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  if (range === 0) return min;
  let result = ((value - min) % range) + min;
  if (result < min) result += range;
  return result;
};

export const approach = (current: number, target: number, delta: number): number => {
  if (current < target) return Math.min(current + delta, target);
  if (current > target) return Math.max(current - delta, target);
  return current;
};