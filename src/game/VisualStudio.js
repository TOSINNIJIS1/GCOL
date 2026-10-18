import React, { useEffect, useRef, useState } from 'react';
import { boardToCells } from './life';

const KEY = 'voai-cgol.visuals.v1';
const GUIDE = 'voai-cgol.guide.v1';
const URL_LIMIT = 1800;
const CELL_LIMIT = 600;
const defaults = { theme: 'neon', color: '#75f5df', grid: true, glow: true };
const read = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return defaults; } };
const readGuide = () => { try { return !localStorage.getItem(GUIDE); } catch (_) { return false; } };
const download = (name, content, type) => { try { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); return true; } catch (_) { return false; } };
const saveCanvas = (canvas, setMessage) => { try { canvas.toBlob((blob) => { if (!blob || !download('voai-cgol-world.png', blob, 'image/png')) setMessage('PNG export is unavailable in this browser.'); else setMessage('PNG exported.'); }, 'image/png'); } catch (_) { setMessage('PNG export is unavailable in this browser.'); } };
export function exportBoardPng(board, color = '#75f5df', setMessage = () => {}) {
  if (!board || !board.length || !board[0].length) { setMessage('Nothing to export yet.'); return; }
  const size = 24; const canvas = document.createElement('canvas'); canvas.width = board[0].length * size; canvas.height = board.length * size;
  const ctx = canvas.getContext('2d'); if (!ctx) { setMessage('PNG export is unavailable in this browser.'); return; }
  ctx.fillStyle = '#080c10'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((cell, x) => { if (cell) { ctx.fillStyle = color; ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2); } })); saveCanvas(canvas, setMessage);
}
export function exportInfinitePng(cells, view, size, prefs, setMessage = () => {}) {
  const living = (cells || []).filter((cell) => cell.length < 3 || cell[2]);
  if (!living.length) { setMessage('Nothing visible to export.'); return; }
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(size.width)); canvas.height = Math.max(1, Math.round(size.height));
  const ctx = canvas.getContext('2d'); if (!ctx) { setMessage('PNG export is unavailable in this browser.'); return; }
  ctx.fillStyle = '#071115'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (prefs.grid) { ctx.strokeStyle = '#1a4c4e55'; ctx.lineWidth = 1; for (let x = 0; x <= canvas.width; x += view.zoom) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); } for (let y = 0; y <= canvas.height; y += view.zoom) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); } }
  living.forEach(([x, y]) => { const px = canvas.width / 2 + (x - view.x) * view.zoom; const py = canvas.height / 2 + (y - view.y) * view.zoom; ctx.fillStyle = prefs.color; if (prefs.glow) { ctx.shadowColor = prefs.color; ctx.shadowBlur = 9; } ctx.fillRect(Math.round(px - view.zoom / 2), Math.round(py - view.zoom / 2), Math.max(1, view.zoom - 1), Math.max(1, view.zoom - 1)); ctx.shadowBlur = 0; }); saveCanvas(canvas, setMessage);
}
const validFinite = (cells) => Array.isArray(cells) && cells.length <= CELL_LIMIT && cells.every((cell) => Array.isArray(cell) && cell.length === 2 && cell.every(Number.isInteger));
const validWorld = (cells) => Array.isArray(cells) && cells.length <= CELL_LIMIT && cells.every((cell) => typeof cell === 'string' && /^-?\d{1,7},-?\d{1,7}$/.test(cell));
export default function VisualStudio({ board, onLoad, world, view, visibleCells, viewportSize, onLoadWorld }) {
  const [prefs, setPrefs] = useState(read); const [message, setMessage] = useState(''); const [guide, setGuide] = useState(readGuide); const imported = useRef(false); const infinite = world instanceof Set;
  useEffect(() => { document.documentElement.dataset.theme = prefs.theme; document.documentElement.style.setProperty('--cyan', prefs.color); document.documentElement.dataset.grid = prefs.grid ? 'on' : 'off'; document.documentElement.dataset.glow = prefs.glow ? 'on' : 'off'; try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (_) {} }, [prefs]);
  const share = () => { const cells = infinite ? [...world] : boardToCells(board); if (!cells.length) { setMessage('Nothing to share yet.'); return; } const data = { v: 1, mode: infinite ? 'infinite' : 'finite', cells }; const payload = btoa(JSON.stringify(data)); if (cells.length > CELL_LIMIT || payload.length > URL_LIMIT) { setMessage(download('voai-cgol-world.json', JSON.stringify(data), 'application/json') ? 'World is too large for a safe URL; downloaded JSON instead.' : 'World is too large to share, and download failed.'); return; } const url = `${window.location.origin}${window.location.pathname}#world=${payload}`; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => setMessage('Share link copied.')).catch(() => setMessage('Share link created; copy it from the address bar.')); else setMessage('Share link created; copy it from the address bar.'); window.history.replaceState(null, '', `#world=${payload}`); };
  useEffect(() => { const match = window.location.hash.match(/^#world=(.+)$/); if (imported.current || !match || (!onLoad && !onLoadWorld)) return; imported.current = true; try { const data = JSON.parse(atob(match[1])); if (!data || data.v !== 1) throw new Error(); if (data.mode === 'infinite' && validWorld(data.cells) && onLoadWorld) onLoadWorld(new Set(data.cells)); else if ((data.mode === 'finite' || !data.mode) && validFinite(data.cells) && onLoad) onLoad(data.cells); else throw new Error(); setMessage('Shared world loaded.'); } catch (_) { setMessage('That share link is invalid, unsupported, or too large.'); } }, [onLoad, onLoadWorld]);
  const exportPng = () => infinite ? exportInfinitePng(visibleCells, view, viewportSize, prefs, setMessage) : exportBoardPng(board, prefs.color, setMessage);
  return <><section className="visualStudio"><div><span className="panelKicker">APPEARANCE & SHARE</span><label>Theme<select value={prefs.theme} onChange={(event) => setPrefs({ ...prefs, theme: event.target.value })}><option value="classic">Classic</option><option value="neon">Neon</option><option value="minimal">Minimal</option><option value="midnight">Midnight</option></select></label><label>Live color<input type="color" value={prefs.color} onChange={(event) => setPrefs({ ...prefs, color: event.target.value })} /></label><label><input type="checkbox" checked={prefs.grid} onChange={(event) => setPrefs({ ...prefs, grid: event.target.checked })} /> Grid</label><label><input type="checkbox" checked={prefs.glow} onChange={(event) => setPrefs({ ...prefs, glow: event.target.checked })} /> Glow</label></div><div><button type="button" onClick={share}>Share world</button><button type="button" onClick={exportPng}>Export PNG</button><small role="status">{message}</small></div></section>{guide && <aside className="onboarding" role="dialog" aria-label="Quick guide"><b>Welcome to VOAI-CGOL</b><p>Draw a world, press Space to play, then explore patterns, replays, and sharing.</p><button type="button" onClick={() => { try { localStorage.setItem(GUIDE, '1'); } catch (_) {} setGuide(false); }}>Got it</button></aside>}</>;
}
