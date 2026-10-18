export const PATTERNS = {
  glider: { label: 'Glider', category: 'Spaceship', detail: 'A traveler that keeps moving.', cells: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
  beacon: { label: 'Beacon', category: 'Oscillator', detail: 'A period-two oscillator.', cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 2], [2, 3], [3, 2], [3, 3]] },
  pulsar: { label: 'Pulsar', category: 'Oscillator', detail: 'A period-three oscillator.', cells: [[0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10], [2, 0], [2, 5], [2, 7], [2, 12], [3, 0], [3, 5], [3, 7], [3, 12], [4, 0], [4, 5], [4, 7], [4, 12], [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10], [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10], [8, 0], [8, 5], [8, 7], [8, 12], [9, 0], [9, 5], [9, 7], [9, 12], [10, 0], [10, 5], [10, 7], [10, 12], [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10]] },
  blinker: { label: 'Blinker', category: 'Oscillator', detail: 'The simplest oscillator.', cells: [[0, 0], [0, 1], [0, 2]] },
  block: { label: 'Block', category: 'Still life', detail: 'A quiet, unchanging still life.', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
};
