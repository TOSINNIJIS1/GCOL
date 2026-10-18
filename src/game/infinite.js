const key = (x, y) => `${x},${y}`;
const parse = (value) => value.split(',').map(Number);
const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export const cellsToWorld = (cells = []) => new Set(cells.map(([y, x]) => key(x, y)));
export const worldToCells = (world) => [...world].map(parse).map(([x, y]) => [y, x]);
export const stepWorld = (world, limit = 50000) => {
  const counts = new Map();
  world.forEach((value) => { const [x, y] = parse(value); offsets.forEach(([dx, dy]) => { const next = key(x + dx, y + dy); counts.set(next, (counts.get(next) || 0) + 1); }); });
  const next = new Set();
  counts.forEach((count, value) => { if ((count === 3 || (count === 2 && world.has(value))) && next.size < limit) next.add(value); });
  return next;
};
export const worldKey = key;
