import { appendSnapshot, exportRecording, importRecording, makeSnapshot, signature } from './recording';

test('counts simultaneous births and deaths with unchanged population', () => {
  const first = makeSnapshot(new Set(['0,0', '1,0', '2,0']), 0);
  expect(makeSnapshot(new Set(['1,-1', '1,0', '1,1']), 1, first).analytics)
    .toEqual({ population: 3, births: 2, deaths: 2 });
  const finite = makeSnapshot([[0,0,0], [1,1,1], [0,0,0]], 0);
  expect(makeSnapshot([[0,1,0], [0,1,0], [0,1,0]], 1, finite).analytics)
    .toEqual({ population: 3, births: 2, deaths: 2 });
});

test('rejects malformed snapshot data before restoring a world', () => {
  const json = (state) => JSON.stringify({ schema: 'voai-cgol-recording', version: 1, mode: 'infinite', snapshots: [{ generation: 0, state }] });
  expect(() => importRecording(json(['invalid']), 'infinite')).toThrow('Invalid infinite');
  expect(() => importRecording(json(['0,0', '0,0']), 'infinite')).toThrow('Invalid infinite');
  expect(() => importRecording('null', 'finite')).toThrow('schema');
});

test('recordings retain bounded history and preserve analytics', () => {
  const first = makeSnapshot([[1, 0], [0, 0]], 0);
  const second = makeSnapshot([[1, 1], [0, 0]], 1, first);
  expect(second.analytics).toEqual({ population: 2, births: 1, deaths: 0 });
  expect(appendSnapshot([first, second], makeSnapshot([[0]], 2, second), 2)).toHaveLength(2);
});

test('recording JSON round-trips and rejects incorrect modes', () => {
  const snapshots = [makeSnapshot(new Set(['0,0']), 0)];
  const json = exportRecording('infinite', snapshots);
  expect(importRecording(json, 'infinite')).toEqual(snapshots);
  expect(() => importRecording(json, 'finite')).toThrow('schema or mode');
  expect(signature(new Set(['2,2', '1,1']))).toBe('1,1|2,2');
});
