import { boardToCells, patternBounds } from './life';

export const MAX_RLE_DIMENSION = 200;
export const MAX_RLE_CELLS = 10000;

const parseError = (message) => { throw new Error(message); };

export function parseRle(source) {
    if (typeof source !== 'string' || !source.trim()) parseError('Paste an RLE pattern before importing.');
    const lines = source.replace(/\r/g, '').split('\n');
    const headerIndex = lines.findIndex((line) => /^\s*x\s*=\s*\d+/i.test(line));
    if (headerIndex === -1) parseError('Missing RLE header. Start with “x = width, y = height”.');
    const header = lines[headerIndex].match(/^\s*x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)(?:\s*,\s*rule\s*=\s*([^,\s]+))?\s*$/i);
    if (!header) parseError('The RLE header is invalid. Use x = number, y = number, rule = B3/S23.');
    const width = Number(header[1]);
    const height = Number(header[2]);
    const rule = (header[3] || 'B3/S23').toUpperCase();
    if (width < 1 || height < 1 || width > MAX_RLE_DIMENSION || height > MAX_RLE_DIMENSION) parseError(`RLE dimensions must be between 1 and ${MAX_RLE_DIMENSION}.`);
    if (width * height > MAX_RLE_CELLS) parseError(`RLE contains too many cells; the limit is ${MAX_RLE_CELLS}.`);
    if (rule !== 'B3/S23' && rule !== 'S23/B3') parseError('Only Conway’s Life rule B3/S23 is supported.');
    const data = lines.slice(headerIndex + 1).filter((line) => !/^\s*#/.test(line)).join('').replace(/\s/g, '');
    if (!data.includes('!')) parseError('RLE data must end with an exclamation mark (!).');
    const end = data.indexOf('!');
    if (data.slice(end + 1)) parseError('Unexpected data appears after the RLE terminator (!).');
    let row = 0;
    let col = 0;
    let countText = '';
    const cells = [];
    for (const token of data.slice(0, end)) {
        if (/\d/.test(token)) { countText += token; continue; }
        if (!/[ob$]/i.test(token)) parseError(`Unsupported RLE token “${token}”.`);
        const count = Number(countText || 1);
        countText = '';
        if (!Number.isSafeInteger(count) || count < 1) parseError('RLE run lengths must be positive whole numbers.');
        if (token.toLowerCase() === '$') { row += count; col = 0; }
        else {
            if (row >= height || col + count > width) parseError('RLE data exceeds its declared dimensions.');
            if (token.toLowerCase() === 'o') for (let index = 0; index < count; index += 1) cells.push([row, col + index]);
            col += count;
        }
        if (row >= height) parseError('RLE data exceeds its declared height.');
        if (cells.length > MAX_RLE_CELLS) parseError(`RLE contains more than ${MAX_RLE_CELLS} living cells.`);
    }
    if (countText) parseError('RLE ends with a run length but no cell token.');
    return { width, height, cells, rule: 'B3/S23' };
}

export function exportRle(board, name = 'VOAI-CGOL pattern') {
    const cells = boardToCells(board);
    if (!cells.length) throw new Error('Add at least one living cell before exporting a pattern.');
    const bounds = patternBounds(cells);
    const occupied = new Set(cells.map(([row, col]) => `${row - bounds.minRow}:${col - bounds.minCol}`));
    const rows = [];
    for (let row = 0; row < bounds.rows; row += 1) {
        let line = '';
        let previous = null;
        let run = 0;
        const append = () => { if (previous) line += `${run > 1 ? run : ''}${previous}`; };
        for (let col = 0; col < bounds.cols; col += 1) {
            const token = occupied.has(`${row}:${col}`) ? 'o' : 'b';
            if (token === previous) run += 1;
            else { append(); previous = token; run = 1; }
        }
        append();
        rows.push(line.replace(/b+$/, ''));
    }
    while (rows.length > 1 && !rows[rows.length - 1]) rows.pop();
    return `#N ${String(name).replace(/[\r\n]/g, ' ').trim() || 'VOAI-CGOL pattern'}\n#C Exported from VOAI-CGOL\nx = ${bounds.cols}, y = ${rows.length}, rule = B3/S23\n${rows.map((line, index) => `${line || 'b'}${index === rows.length - 1 ? '!' : '$'}`).join('')}`;
}
