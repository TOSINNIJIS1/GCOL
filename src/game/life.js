export const DEFAULT_OPERATIONS = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];

export const createBoard = (rows, cols) => Array.from({ length: rows }, () => Array(cols).fill(0));
export const countPopulation = (board) => board.reduce((total, row) => total + row.reduce((sum, cell) => sum + (cell ? 1 : 0), 0), 0);
export const boardSignature = (board) => board.map((row) => row.join('')).join('|');

export function evolveBoard(board, { wrapEdges = false, operations = DEFAULT_OPERATIONS } = {}) {
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    return board.map((row, rowIndex) => row.map((cell, colIndex) => {
        const neighbors = operations.reduce((total, [rowOffset, colOffset]) => {
            const neighborRow = wrapEdges ? (rowIndex + rowOffset + rows) % rows : rowIndex + rowOffset;
            const neighborCol = wrapEdges ? (colIndex + colOffset + cols) % cols : colIndex + colOffset;
            return total + (board[neighborRow] && board[neighborRow][neighborCol] ? 1 : 0);
        }, 0);
        return neighbors === 3 || (cell === 1 && neighbors === 2) ? 1 : 0;
    }));
}

export function patternBounds(cells) {
    if (!cells.length) return { minRow: 0, minCol: 0, rows: 0, cols: 0 };
    const rows = cells.map(([row]) => row);
    const cols = cells.map(([, col]) => col);
    const minRow = Math.min(...rows);
    const minCol = Math.min(...cols);
    return { minRow, minCol, rows: Math.max(...rows) - minRow + 1, cols: Math.max(...cols) - minCol + 1 };
}

export function placePatternCentered(rows, cols, cells) {
    const board = createBoard(rows, cols);
    const bounds = patternBounds(cells);
    const top = Math.floor((rows - bounds.rows) / 2);
    const left = Math.floor((cols - bounds.cols) / 2);
    cells.forEach(([row, col]) => {
        const targetRow = top + row - bounds.minRow;
        const targetCol = left + col - bounds.minCol;
        if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) board[targetRow][targetCol] = 1;
    });
    return board;
}

export function boardToCells(board) {
    const cells = [];
    board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => { if (cell) cells.push([rowIndex, colIndex]); }));
    return cells;
}
