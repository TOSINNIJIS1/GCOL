export const RECORDING_VERSION = 1;
export const MAX_RECORDING_SNAPSHOTS = 500;
export const MAX_RECORDING_BYTES = 2 * 1024 * 1024;
export const cloneState = (state) => Array.isArray(state) ? state.map((row) => [...row]) : [...state];
export const signature = (state) => Array.isArray(state) ? state.map((row) => row.join('')).join('|') : [...state].sort().join('|');
export const makeSnapshot = (state, generation, previous = null) => {
  const population = Array.isArray(state) ? state.flat().filter(Boolean).length : state.size;
  let births = 0;
  let deaths = 0;
  if (previous) {
    const live = (value) => {
      if (value instanceof Set) return value;
      if (!value.length || typeof value[0] === 'string') return new Set(value);
      const cells = new Set();
      value.forEach((row, y) => row.forEach((cell, x) => { if (cell) cells.add(`${x},${y}`); }));
      return cells;
    };
    const current = live(state);
    const prior = live(previous.state);
    current.forEach((cell) => { if (!prior.has(cell)) births += 1; });
    prior.forEach((cell) => { if (!current.has(cell)) deaths += 1; });
  }
  return { generation, state: cloneState(state), analytics: { population, births, deaths } };
};
export const appendSnapshot = (items, snapshot, limit) => [...items, snapshot].slice(-Math.max(2, Math.min(limit, MAX_RECORDING_SNAPSHOTS)));
export function exportRecording(mode, snapshots) {
  const text = JSON.stringify({ schema: 'voai-cgol-recording', version: RECORDING_VERSION, mode, snapshots });
  importRecording(text, mode);
  return text;
}
export function importRecording(text, mode) {
  if (typeof text !== 'string' || !text.length || new TextEncoder().encode(text).length > MAX_RECORDING_BYTES) throw new Error('Recording is empty or exceeds the 2 MB limit.');
  let value;
  try { value = JSON.parse(text); } catch (_) { throw new Error('Recording JSON is invalid.'); }
  if (!value || !['finite', 'infinite'].includes(mode) || value.schema !== 'voai-cgol-recording' || value.version !== RECORDING_VERSION || value.mode !== mode || !Array.isArray(value.snapshots) || !value.snapshots.length || value.snapshots.length > MAX_RECORDING_SNAPSHOTS) throw new Error('Recording schema or mode is not supported.');
  let dimensions;
  const result = [];
  for (const item of value.snapshots) {
    if (!item || !Number.isSafeInteger(item.generation) || item.generation < 0 || (result.length && item.generation <= result[result.length - 1].generation)) throw new Error('Snapshot generations must increase.');
    const state = item.state;
    if (mode === 'finite') {
      if (!Array.isArray(state) || !state.length || state.length > 200 || !Array.isArray(state[0]) || !state[0].length || state[0].length > 200 || !state.every((row) => Array.isArray(row) && row.length === state[0].length && row.every((cell) => cell === 0 || cell === 1))) throw new Error('Invalid finite board: expected a rectangular grid of 0 and 1, up to 200 × 200.');
      const size = `${state.length},${state[0].length}`;
      if (dimensions && dimensions !== size) throw new Error('All recorded boards must have the same dimensions.');
      dimensions = size;
    } else if (!Array.isArray(state) || state.length > 100000 || !state.every((cell) => typeof cell === 'string' && /^-?\d{1,7},-?\d{1,7}$/.test(cell)) || new Set(state).size !== state.length) {
      throw new Error('Invalid infinite world: expected unique integer coordinates, up to 100,000 cells.');
    }
    result.push(makeSnapshot(mode === 'infinite' ? new Set(state) : state, item.generation, result[result.length - 1]));
  }
  return result;
}
