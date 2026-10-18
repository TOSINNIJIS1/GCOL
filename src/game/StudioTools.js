import React, { useMemo, useState } from 'react';
import { boardToCells, patternBounds, placePatternCentered } from './life';
import { exportRle, parseRle } from './rle';

const FAVORITES_KEY = 'voai-cgol.pattern-favorites.v1';
const readFavorites = () => { try { const value = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]'); return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string'))] : []; } catch (_) { return []; } };
export function PatternPreview({ cells }) {
  const bounds = patternBounds(cells);
  return <svg className="patternPreview" viewBox={`${bounds.minCol - 1} ${bounds.minRow - 1} ${bounds.cols + 2} ${bounds.rows + 2}`} aria-hidden="true">
    {cells.map(([row, col]) => <rect key={`${row},${col}`} x={col} y={row} width=".88" height=".88" />)}
  </svg>;
}
export const CATALOG = {
  toad: { label: 'Toad', category: 'Oscillator', detail: 'A period-two oscillator with a six-cell phase.', cells: [[1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2]] },
  lightweight: { label: 'Lightweight spaceship', category: 'Spaceship', detail: 'A compact ship that travels across the grid.', cells: [[0, 1], [0, 4], [1, 0], [2, 0], [2, 4], [3, 0], [3, 1], [3, 2], [3, 3]] },
  pentadecathlon: { label: 'Pentadecathlon', category: 'Oscillator', detail: 'A long period fifteen oscillator.', cells: [[0, 2], [0, 7], [1, 0], [1, 1], [1, 3], [1, 4], [1, 5], [1, 6], [1, 8], [1, 9], [2, 2], [2, 7]] },
  tub: { label: 'Tub', category: 'Still life', detail: 'A stable four-cell ring.', cells: [[0, 1], [1, 0], [1, 2], [2, 1]] },
};
export function PatternExplorer({ patterns, onLoad }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const [favorites, setFavorites] = useState(readFavorites);
  const [message, setMessage] = useState('');
  const catalog = useMemo(() => ({ ...patterns, ...CATALOG }), [patterns]);
  const items = useMemo(() => Object.entries(catalog).filter(([name, item]) => (category === 'All' || item.category === category || (category === 'Favorites' && favorites.includes(name))) && `${name} ${item.label} ${item.category} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase())), [category, favorites, catalog, query]);
  const toggleFavorite = (name) => { const next = favorites.includes(name) ? favorites.filter((entry) => entry !== name) : [...favorites, name]; setFavorites(next); try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setMessage('Favorites saved on this device.'); } catch (_) { setMessage('Favorites updated for this session. Browser storage is unavailable.'); } };
  return <section className="explorer" aria-labelledby="explorer-title"><div className="explorerHead"><div><span className="panelKicker">PATTERN EXPLORER</span><h2 id="explorer-title">Browse the catalog</h2><small>{items.length} patterns · {favorites.length} favorites</small></div><input aria-label="Search patterns" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, type, or detail" /></div><div className="explorerFilters">{['All', 'Spaceship', 'Oscillator', 'Still life', 'Favorites'].map((item) => <button type="button" className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><div className="explorerList">{items.map(([name, item]) => <article key={name}><PatternPreview cells={item.cells} /><button type="button" onClick={() => { onLoad(item.label, item.cells); setMessage(`${item.label} placed on the canvas.`); }}><b>{item.label}</b><small>{item.category} · {item.detail}</small><small>{item.cells.length} living cells · {patternBounds(item.cells).cols} × {patternBounds(item.cells).rows}</small><em>Place on canvas →</em></button><button type="button" className={favorites.includes(name) ? 'fav active' : 'fav'} aria-label={`Favorite ${item.label}`} aria-pressed={favorites.includes(name)} onClick={() => toggleFavorite(name)}>★</button></article>)}{!items.length && <p className="explorerEmpty">{category === 'Favorites' ? 'Star a pattern to find it here. Try another filter or clear your search.' : 'No matching patterns. Try another name or category.'}</p>}</div><p role="status">{message}</p></section>;
}
const normalize = (cells) => { const b = patternBounds(cells); return cells.map(([r, c]) => [r - b.minRow, c - b.minCol]); };
export function PatternDesigner({ board, rows, cols, onReplace, onSave }) {
  const [clipboard, setClipboard] = useState(null); const cells = boardToCells(board);
  const transform = (type) => { const source = normalize(cells); if (!source.length) return; const b = patternBounds(source); const next = type === 'rotate' ? source.map(([r, c]) => [c, b.rows - 1 - r]) : type === 'flipX' ? source.map(([r, c]) => [r, b.cols - 1 - c]) : source.map(([r, c]) => [b.rows - 1 - r, c]); onReplace(placePatternCentered(rows, cols, next), `Pattern ${type === 'rotate' ? 'rotated' : 'flipped'}`); };
  const copy = () => { if (!cells.length) return; setClipboard(exportRle(board, 'Designer selection')); };
  const paste = () => { if (!clipboard) return; try { onReplace(placePatternCentered(rows, cols, parseRle(clipboard).cells), 'Pattern pasted'); } catch (_) {} };
  return <section className="designer"><span className="panelKicker">PATTERN DESIGNER</span><p>{cells.length} cells selected · select all living cells, then transform or copy.</p><div><button type="button" onClick={copy} disabled={!cells.length}>Copy</button><button type="button" onClick={paste} disabled={!clipboard}>Paste</button><button type="button" onClick={() => transform('rotate')} disabled={!cells.length}>Rotate</button><button type="button" onClick={() => transform('flipX')} disabled={!cells.length}>Flip H</button><button type="button" onClick={() => transform('flipY')} disabled={!cells.length}>Flip V</button><button type="button" onClick={() => onReplace(Array.from({ length: rows }, () => Array(cols).fill(0)), 'Selection erased')} disabled={!cells.length}>Erase</button><button type="button" onClick={onSave} disabled={!cells.length}>Save</button></div></section>;
}
