import React, { useEffect, useMemo, useRef, useState } from 'react';
import './infinite.scss';
import { cellsToWorld, stepWorld, worldKey } from './infinite';
import Timeline from './Timeline';
import { appendSnapshot, makeSnapshot, signature } from './recording';
import VisualStudio from './VisualStudio';
import { PatternExplorer } from './StudioTools';
import { PATTERNS } from './patterns';

export default function InfiniteWorld({ initialCells = [] }) {
  const [world, setWorld] = useState(() => cellsToWorld(initialCells));
  const [view, setView] = useState({ x: 0, y: 0, zoom: 22 });
  const [speed, setSpeed] = useState(250);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [limit, setLimit] = useState(50000);
  const [recordLimit, setRecordLimit] = useState(120);
  const [snapshots, setSnapshots] = useState(() => [makeSnapshot(cellsToWorld(initialCells), 0)]);
  const [cursor, setCursor] = useState(0);
  const [detection, setDetection] = useState('');
  const repeatRef = useRef(new Map([[signature(cellsToWorld(initialCells)), 1]]));
  const [tool, setTool] = useState('draw');
  const drag = useRef(null);
  const paint = useRef(null);
  const viewport = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 760, height: 480 });
  useEffect(() => {
    if (!viewport.current || !window.ResizeObserver) return undefined;
    const observer = new window.ResizeObserver(([entry]) => setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const record = (next, nextGeneration) => { const nextSnapshot = makeSnapshot(next, nextGeneration, snapshots[cursor]); const prior = snapshots.slice(0, cursor + 1); const match = prior.findIndex((item) => signature(new Set(item.state)) === signature(next)); setDetection(match >= 0 ? (match === cursor ? 'Stable world detected' : `Repeated state · period ${nextGeneration - prior[match].generation}`) : ''); const nextItems = appendSnapshot(prior, nextSnapshot, recordLimit); setSnapshots(nextItems); setCursor(nextItems.length - 1); };
  const advance = () => { const next = stepWorld(world, limit); const nextGeneration = generation + 1; const nextSignature = signature(next); const currentSignature = signature(world); const occurrences = (repeatRef.current.get(nextSignature) || 0) + 1; repeatRef.current.set(nextSignature, occurrences); if (repeatRef.current.size > 500) repeatRef.current.delete(repeatRef.current.keys().next().value); setWorld(next); setGeneration(nextGeneration); record(next, nextGeneration); if (nextSignature === currentSignature) { setRunning(false); setDetection('Stable world detected · paused'); } else if (occurrences >= 5) { setRunning(false); setDetection('Repeated state five times · paused'); } };
  useEffect(() => { if (!running) return undefined; const timer = window.setInterval(advance, speed); return () => window.clearInterval(timer); }, [running, world, limit, snapshots, cursor, speed]);
  const cells = useMemo(() => {
    const spanX = Math.ceil(viewportSize.width / view.zoom / 2) + 1; const spanY = Math.ceil(viewportSize.height / view.zoom / 2) + 1;
    return [...world].map((id) => { const [x, y] = id.split(',').map(Number); return [x, y]; }).filter(([x, y]) => Math.abs(x - view.x) <= spanX && Math.abs(y - view.y) <= spanY);
  }, [view, world, viewportSize]);
  const resetWorld = (next = new Set()) => { setRunning(false); setWorld(next); setGeneration(0); setSnapshots([makeSnapshot(next, 0)]); setCursor(0); setDetection(''); repeatRef.current = new Map([[signature(next), 1]]); };
  const resetView = () => setView({ x: 0, y: 0, zoom: 22 });
  const toggle = (x, y) => { const next = new Set(world); const id = worldKey(x, y); if (next.has(id)) next.delete(id); else if (next.size < limit) next.add(id); resetWorld(next); };
  const restore = (index) => { const item = snapshots[index]; setRunning(false); setWorld(new Set(item.state)); setGeneration(item.generation); setCursor(index); setDetection(''); repeatRef.current = new Map([[signature(new Set(item.state)), 1]]); };
  const fitWorld = (next = world) => {
    if (!next.size) { resetView(); return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    next.forEach((id) => {
      const [x, y] = id.split(',').map(Number);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    const zoom = Math.max(.01, Math.min(42, Math.floor(Math.min(viewportSize.width / (maxX - minX + 5), viewportSize.height / (maxY - minY + 5)) * 100) / 100));
    setView({ x: Math.round((minX + maxX) / 2), y: Math.round((minY + maxY) / 2), zoom });
  };
  const loadSharedWorld = (next) => { resetWorld(next); fitWorld(next); };
  const loadPattern = (name, pattern) => {
    const rows = pattern.map(([y]) => y), cols = pattern.map(([, x]) => x);
    const offsetY = Math.floor((Math.min(...rows) + Math.max(...rows)) / 2);
    const offsetX = Math.floor((Math.min(...cols) + Math.max(...cols)) / 2);
    loadSharedWorld(cellsToWorld(pattern.map(([y, x]) => [y - offsetY, x - offsetX])));
    setDetection(`${name} loaded · ready to play`);
  };
  const zoomBy = (amount) => setView((current) => ({ ...current, zoom: Math.max(.01, Math.min(42, current.zoom + amount)) }));
  const pointToCell = (event) => { const box = event.currentTarget.getBoundingClientRect(); return [Math.round(view.x + (event.clientX - box.left - box.width / 2) / view.zoom), Math.round(view.y + (event.clientY - box.top - box.height / 2) / view.zoom)]; };
  return <main className="infiniteShell"><header><p className="sectionLabel">INFINITE WORLD</p><h1>Explore without <em>edges.</em></h1><p>Paint a sparse world, then pan, zoom, and simulate only the cells that matter.</p></header><section className="infiniteControls" aria-label="Infinite world controls"><div className="controlGroup"><button onClick={() => setRunning(!running)} type="button">{running ? 'Pause' : 'Play'}</button><button onClick={advance} disabled={running} type="button">Step</button><button onClick={() => resetWorld()} type="button">Clear</button></div><div className="controlGroup" aria-label="Canvas tool"><button type="button" aria-pressed={tool === 'draw'} onClick={() => setTool('draw')}>Draw</button><button type="button" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}>Pan</button></div><div className="controlGroup viewControls"><button onClick={() => zoomBy(-4)} type="button" aria-label="Zoom out">−</button><label>Zoom <input aria-label="Zoom" type="range" min="0.01" step="0.01" max="42" value={view.zoom} onChange={(event) => setView({ ...view, zoom: Number(event.target.value) })} /></label><button onClick={() => zoomBy(4)} type="button" aria-label="Zoom in">+</button><button onClick={resetView} type="button">Center view</button><button onClick={() => fitWorld()} type="button">Fit world</button></div><label>Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="800">Slow</option><option value="250">Normal</option><option value="100">Fast</option></select></label><label className="limitControl">Cell limit<select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option value="10000">10k</option><option value="50000">50k</option><option value="100000">100k</option></select></label><span className="worldReadout" aria-live="polite">G{generation} · {world.size} living · ({view.x}, {view.y}) {detection && `· ${detection}`}</span></section><div className="infiniteStage"><div className="viewportMeta"><span>Viewport {Math.round(viewportSize.width)} × {Math.round(viewportSize.height)}</span><span>{running ? 'Running' : 'Paused'} · {cells.length} visible cells</span></div><div ref={viewport} className={`infiniteViewport ${tool}`} tabIndex="0" role="application" aria-label="Infinite Game of Life canvas" onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', '+', '=', '-'].includes(event.key)) event.preventDefault(); if (event.key === ' ') setRunning((value) => !value); if (event.key === 'Enter') toggle(view.x, view.y); if (event.key === '+' || event.key === '=') zoomBy(4); if (event.key === '-') zoomBy(-4); if (event.key === 'ArrowLeft') setView((current) => ({ ...current, x: current.x - 1 })); if (event.key === 'ArrowRight') setView((current) => ({ ...current, x: current.x + 1 })); if (event.key === 'ArrowUp') setView((current) => ({ ...current, y: current.y - 1 })); if (event.key === 'ArrowDown') setView((current) => ({ ...current, y: current.y + 1 })); }} onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY > 0 ? -2 : 2); }} onPointerDown={(event) => { if (drag.current || paint.current) return; event.preventDefault(); event.currentTarget.focus(); if (event.button === 0 && tool === 'draw' && !event.shiftKey) { const [x, y] = pointToCell(event); paint.current = { value: !world.has(worldKey(x, y)), last: `${x},${y}` }; toggle(x, y); } else { drag.current = { x: event.clientX, y: event.clientY, view }; } event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (paint.current) { const [x, y] = pointToCell(event); const id = `${x},${y}`; if (id !== paint.current.last) { paint.current.last = id; const alive = world.has(id); if (alive !== paint.current.value) toggle(x, y); } } else if (drag.current) { const dx = Math.round((drag.current.x - event.clientX) / view.zoom); const dy = Math.round((drag.current.y - event.clientY) / view.zoom); setView({ ...drag.current.view, x: drag.current.view.x + dx, y: drag.current.view.y + dy }); } }} onPointerUp={() => { drag.current = null; paint.current = null; }} onPointerCancel={() => { drag.current = null; paint.current = null; }} style={{ '--size': `${view.zoom}px` }}>{cells.length === 0 && <div className="infiniteEmpty"><strong>{world.size ? 'Cells are outside this view' : 'Start your world'}</strong><span>Draw: click, tap, or drag · choose Pan to move</span></div>}{cells.map(([x, y]) => <i key={`${x}:${y}`} className="alive" aria-hidden="true" style={{ left: `calc(50% + ${(x - view.x) * view.zoom}px)`, top: `calc(50% + ${(y - view.y) * view.zoom}px)` }} />)}</div></div><Timeline mode="infinite" snapshots={snapshots} cursor={cursor} onScrub={restore} onLimit={setRecordLimit} onBranch={() => setSnapshots((items) => items.slice(0, cursor + 1))} onImport={(items) => { setSnapshots(items); const last = items.length - 1; setCursor(last); setWorld(new Set(items[last].state)); setGeneration(items[last].generation); setRunning(false); setDetection(''); repeatRef.current = new Map([[signature(new Set(items[last].state)), 1]]); }} />
    <PatternExplorer patterns={PATTERNS} onLoad={loadPattern} /><VisualStudio world={world} view={view} visibleCells={cells} viewportSize={viewportSize} onLoadWorld={loadSharedWorld} /><p className="infiniteHint">Click, tap, or drag to draw/erase · Pan tool or Shift-drag to move · +/− zoom · arrows move · Enter toggles the center cell · Space plays/pauses.</p></main>;
}
