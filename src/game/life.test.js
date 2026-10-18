import { boardToCells, createBoard, evolveBoard, placePatternCentered } from './life';
import { exportRle, parseRle } from './rle';

const boardWith = (rows, cols, cells) => {
  const board = createBoard(rows, cols);
  cells.forEach(([row, col]) => { board[row][col] = 1; });
  return board;
};

test('still life remains unchanged under Conway B3/S23', () => {
  const block = boardWith(6, 6, [[2, 2], [2, 3], [3, 2], [3, 3]]);
  expect(evolveBoard(block)).toEqual(block);
});

test('blinker oscillates between horizontal and vertical phases', () => {
  const horizontal = boardWith(5, 5, [[2, 1], [2, 2], [2, 3]]);
  const vertical = boardWith(5, 5, [[1, 2], [2, 2], [3, 2]]);
  expect(evolveBoard(horizontal)).toEqual(vertical);
  expect(evolveBoard(vertical)).toEqual(horizontal);
});

test('a glider moves diagonally after four generations', () => {
  let glider = boardWith(8, 8, [[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]]);
  for (let index = 0; index < 4; index += 1) glider = evolveBoard(glider);
  expect(boardToCells(glider)).toEqual(expect.arrayContaining([[2, 3], [3, 4], [4, 2], [4, 3], [4, 4]]));
});

test('fixed edges do not wrap neighbors across the board', () => {
  const edge = boardWith(3, 3, [[0, 0], [0, 2], [2, 0]]);
  expect(evolveBoard(edge)[2][2]).toBe(0);
});

test('edge wrapping makes opposite corners neighbors', () => {
  const edge = boardWith(3, 3, [[0, 0], [0, 2], [2, 0]]);
  expect(evolveBoard(edge, { wrapEdges: true })[2][2]).toBe(1);
});

test('preset placement centers by actual pattern bounds', () => {
  const board = placePatternCentered(9, 11, [[10, 20], [10, 21], [11, 20], [11, 21]]);
  expect(boardToCells(board)).toEqual([[3, 4], [3, 5], [4, 4], [4, 5]]);
});

test('RLE imports and exports standard B3/S23 patterns', () => {
  const pattern = parseRle('#N Glider\nx = 3, y = 3, rule = B3/S23\nbob$2bo$3o!');
  expect(pattern.cells).toEqual([[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]]);
  expect(parseRle(exportRle(boardWith(5, 5, pattern.cells))).cells).toEqual(pattern.cells);
});

test('RLE reports actionable validation errors', () => {
  expect(() => parseRle('x = 3, y = 3, rule = B36/S23\n3o!')).toThrow('Only Conway’s Life rule');
  expect(() => parseRle('x = 2, y = 2\n3o!')).toThrow('exceeds its declared dimensions');
});
