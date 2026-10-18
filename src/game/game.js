import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './game.scss';
import { boardSignature, countPopulation, createBoard, evolveBoard, placePatternCentered } from './life';
import { exportRle, parseRle } from './rle';
import { PatternDesigner, PatternExplorer, PatternPreview } from './StudioTools';
import Timeline from './Timeline';
import { appendSnapshot, makeSnapshot, signature } from './recording';
import VisualStudio from './VisualStudio';

import { PATTERNS } from './patterns';
const SPEEDS = { slow: 900, balanced: 500, fast: 180 };
const HISTORY_LIMIT = 60;
const SAVED_PATTERNS_KEY = 'voai-cgol.custom-patterns.v1';
const copyBoard = (board) => board.map((row) => [...row]);
const MiniPattern = PatternPreview;
const readSaved = () => { try { return JSON.parse(window.localStorage.getItem(SAVED_PATTERNS_KEY) || '[]'); } catch (_) { return []; } };

export default function Game({ gridRow = 20, gridCol = 30, operations }) {
  const empty = useCallback(() => createBoard(gridRow, gridCol), [gridRow, gridCol]);
  const [board, setBoard] = useState(empty);
  const [generation, setGeneration] = useState(0);
  const [running, setRunning] = useState(false);
  const [speedName, setSpeedName] = useState('balanced');
  const [selectedPattern, setSelectedPattern] = useState('glider');
  const [wrapEdges, setWrapEdges] = useState(false);
  const [stopReason, setStopReason] = useState('Ready to experiment');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [history, setHistory] = useState([{ generation: 0, population: 0 }]);
  const [rleText, setRleText] = useState('');
  const [rleMessage, setRleMessage] = useState('');
  const [saveName, setSaveName] = useState('My pattern');
  const [savedPatterns, setSavedPatterns] = useState(readSaved);
  const [recordLimit, setRecordLimit] = useState(120);
  const [snapshots, setSnapshots] = useState(() => [makeSnapshot(empty(), 0)]);
  const [timelineCursor, setTimelineCursor] = useState(0);
  const [detection, setDetection] = useState('');
  const repeatRef = useRef(new Map());
  const paintValueRef = useRef(null);
  const boardRef = useRef(board);
  const alive = useMemo(() => countPopulation(board), [board]);
  const resetTracking = useCallback((nextBoard, nextGeneration = 0) => {
    repeatRef.current = new Map([[boardSignature(nextBoard), 1]]);
    setHistory([{ generation: nextGeneration, population: countPopulation(nextBoard) }]);
    setSnapshots([makeSnapshot(nextBoard, nextGeneration)]); setTimelineCursor(0); setDetection('');
  }, []);
  const record = (nextBoard, nextGeneration) => { const next = makeSnapshot(nextBoard, nextGeneration, snapshots[timelineCursor]); const prior = snapshots.slice(0, timelineCursor + 1); const match = prior.findIndex((item) => signature(item.state) === signature(nextBoard)); setDetection(match >= 0 ? (match === timelineCursor ? 'Stable world' : `Oscillator/repeat · period ${nextGeneration - prior[match].generation}`) : ''); const all = appendSnapshot(prior, next, recordLimit); setSnapshots(all); setTimelineCursor(all.length - 1); };
  const snapshot = useCallback(() => { setUndoStack((stack) => [...stack, { board: copyBoard(board), generation }].slice(-HISTORY_LIMIT)); setRedoStack([]); }, [board, generation]);
  const replaceBoard = useCallback((nextBoard, reason, saveUndo = true) => {
    if (saveUndo) snapshot();
    setRunning(false); setGeneration(0); setBoard(nextBoard); resetTracking(nextBoard); setStopReason(reason);
  }, [resetTracking, snapshot]);

  const step = useCallback(() => {
    const next = evolveBoard(board, { wrapEdges, operations });
    if (boardSignature(next) === boardSignature(board)) { setRunning(false); setStopReason('Paused: stable board detected'); return; }
    const signature = boardSignature(next);
    const occurrences = (repeatRef.current.get(signature) || 0) + 1;
    repeatRef.current.set(signature, occurrences);
    const nextGeneration = generation + 1;
    setBoard(next); setGeneration(nextGeneration);
    record(next, nextGeneration);
    setHistory((items) => [...items, { generation: nextGeneration, population: countPopulation(next) }].slice(-12));
    if (occurrences >= 5) { setRunning(false); setStopReason('Paused: a board state repeated five times'); } else setStopReason('Evolving');
  }, [board, generation, operations, wrapEdges]);
  useEffect(() => { resetTracking(empty()); }, [empty, resetTracking]); // Register the initial empty world once.
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { if (!running) return undefined; const timer = window.setInterval(step, SPEEDS[speedName]); return () => window.clearInterval(timer); }, [running, speedName, step]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if (event.code === 'Space') { event.preventDefault(); setRunning((value) => !value); }
      if (event.key.toLowerCase() === 's') step();
      if (event.key.toLowerCase() === 'r') replaceBoard(empty(), 'Canvas reset');
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [empty, replaceBoard, step]);

  const editCell = (row, col, value, resetRepeats = false) => {
    const next = boardRef.current.map((line, lineIndex) => line.map((cell, cellIndex) => lineIndex === row && cellIndex === col ? value : cell));
    boardRef.current = next;
    setBoard(next);
    if (resetRepeats) resetTracking(next, generation);
  };
  const beginPaint = (event, row, col) => { if (event.button !== undefined && event.button !== 0) return; event.preventDefault(); snapshot(); setRunning(false); paintValueRef.current = board[row][col] ? 0 : 1; editCell(row, col, paintValueRef.current, true); setStopReason('Board edited'); };
  const continuePaint = (event) => { if (paintValueRef.current === null) return; const target = document.elementFromPoint(event.clientX, event.clientY); if (target && target.dataset.row) editCell(Number(target.dataset.row), Number(target.dataset.col), paintValueRef.current, true); };
  const keyEdit = (event, row, col) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); snapshot(); editCell(row, col, board[row][col] ? 0 : 1, true); setRunning(false); setStopReason('Board edited'); }
    const offset = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (offset) { event.preventDefault(); const r = Math.max(0, Math.min(gridRow - 1, row + offset[0])); const c = Math.max(0, Math.min(gridCol - 1, col + offset[1])); const nextCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`); if (nextCell) nextCell.focus(); }
  };
  const loadCells = (name, cells) => { setSelectedPattern(Object.keys(PATTERNS).find((key) => PATTERNS[key].label === name) || name); replaceBoard(placePatternCentered(gridRow, gridCol, cells), `${name} loaded`); };
  const undo = () => { if (!undoStack.length) return; const previous = undoStack[undoStack.length - 1]; setRedoStack((stack) => [...stack, { board: copyBoard(board), generation }].slice(-HISTORY_LIMIT)); setUndoStack((stack) => stack.slice(0, -1)); setBoard(previous.board); setGeneration(previous.generation); setRunning(false); resetTracking(previous.board, previous.generation); setStopReason('Undid last edit'); };
  const redo = () => { if (!redoStack.length) return; const next = redoStack[redoStack.length - 1]; setUndoStack((stack) => [...stack, { board: copyBoard(board), generation }].slice(-HISTORY_LIMIT)); setRedoStack((stack) => stack.slice(0, -1)); setBoard(next.board); setGeneration(next.generation); setRunning(false); resetTracking(next.board, next.generation); setStopReason('Redid last edit'); };
  const importRle = () => { try { const parsed = parseRle(rleText); loadCells('Imported RLE', parsed.cells); setRleMessage(`Imported ${parsed.cells.length} living cells (${parsed.width} × ${parsed.height}).`); } catch (error) { setRleMessage(error.message); } };
  const makeExport = () => { try { setRleText(exportRle(board, saveName)); setRleMessage('RLE export is ready to copy.'); } catch (error) { setRleMessage(error.message); } };
  const savePattern = () => { try { const item = { id: `${Date.now()}`, name: saveName.trim() || 'My pattern', rle: exportRle(board, saveName) }; const next = [...savedPatterns, item].slice(-24); window.localStorage.setItem(SAVED_PATTERNS_KEY, JSON.stringify(next)); setSavedPatterns(next); setRleMessage(`Saved “${item.name}” in this browser.`); } catch (error) { setRleMessage(`Could not save this pattern locally: ${error.message}`); } };
  const erasePattern = (id) => { const next = savedPatterns.filter((item) => item.id !== id); try { window.localStorage.setItem(SAVED_PATTERNS_KEY, JSON.stringify(next)); setSavedPatterns(next); } catch (error) { setRleMessage(`Could not update local patterns: ${error.message}`); } };

  return <main className="simulatorShell">
    <header className="simHeader"><div><p className="sectionLabel">LIFE SIMULATION STUDIO</p><h1>Make something <em>alive.</em></h1><p>Compose, inspect, save, and share Conway’s Game of Life patterns.</p></div><div className={`status ${running ? 'isLive' : ''}`} aria-live="polite"><span />{running ? 'Running' : 'Paused'}<small>{stopReason}</small></div></header>
    <div className="workspace">
      <aside className="libraryPanel panel"><div className="panelTitle"><div><span className="panelKicker">01 / PATTERNS</span><h2>Pattern library</h2></div></div><p className="panelIntro">Every preset is centered from its true bounds, whatever your board size.</p><div className="patternList">{Object.entries(PATTERNS).slice(0, 3).map(([name, pattern]) => <button type="button" className={`patternCard ${selectedPattern === name ? 'selected' : ''}`} key={name} onClick={() => { setSelectedPattern(name); loadCells(pattern.label, pattern.cells); }}><MiniPattern cells={pattern.cells} /><span><strong>{pattern.label}</strong><small>{pattern.detail}</small></span><b>↗</b></button>)}</div><div className="quickPatterns">{Object.entries(PATTERNS).slice(3).map(([name, pattern]) => <button type="button" className={selectedPattern === name ? 'selected' : ''} key={name} onClick={() => { setSelectedPattern(name); loadCells(pattern.label, pattern.cells); }}><MiniPattern cells={pattern.cells} /><span>{pattern.label}</span></button>)}</div><button className="resetLink" type="button" onClick={() => replaceBoard(empty(), 'Canvas cleared')}>+ New empty canvas</button></aside>
      <section className="canvasPanel"><div className="canvasTopline"><span>CANVAS / {gridCol} × {gridRow}</span><span className="canvasHint">Draw: mouse, touch, or keyboard</span></div><div className="canvasFrame"><div className="board" role="grid" aria-label="Game of Life board" onPointerMove={continuePaint} onPointerUp={() => { paintValueRef.current = null; }} onPointerCancel={() => { paintValueRef.current = null; }} style={{ gridTemplateColumns: `repeat(${gridCol}, minmax(8px, 1fr))`, '--grid-cols': gridCol, '--grid-rows': gridRow }}>{board.map((row, rowIndex) => row.map((cell, colIndex) => <button type="button" role="gridcell" data-row={rowIndex} data-col={colIndex} aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${cell ? 'alive' : 'dead'}`} className={`cell${cell ? ' alive' : ''}`} key={`${rowIndex}-${colIndex}`} onPointerDown={(event) => beginPaint(event, rowIndex, colIndex)} onKeyDown={(event) => keyEdit(event, rowIndex, colIndex)} />))}</div></div><div className="canvasFooter"><span><i className="keyDot" /> {alive} living cells</span><span>Space play/pause · S step · R reset</span></div></section>
      <aside className="inspectorPanel panel"><div className="panelTitle"><div><span className="panelKicker">02 / CONTROL</span><h2>Simulation</h2></div><button className={`edgeToggle ${wrapEdges ? 'enabled' : ''}`} type="button" aria-pressed={wrapEdges} onClick={() => { const value = !wrapEdges; setWrapEdges(value); resetTracking(board, generation); setStopReason(`Edge wrap ${value ? 'on' : 'off'}`); }}>↻ Wrap</button></div><button className={`playButton ${running ? 'playing' : ''}`} type="button" onClick={() => { if (running) setStopReason('Paused manually'); else { resetTracking(board, generation); setStopReason('Evolving'); } setRunning(!running); }}><span>{running ? 'Ⅱ' : '▶'}</span>{running ? 'Pause simulation' : 'Play simulation'}</button><div className="controlRow"><button type="button" onClick={step} disabled={running}><span>»</span>Step</button><button type="button" onClick={() => replaceBoard(Array.from({ length: gridRow }, () => Array.from({ length: gridCol }, () => Math.random() > 0.77 ? 1 : 0)), 'New random world')}><span>⤨</span>Randomize</button><button type="button" onClick={() => replaceBoard(empty(), 'Canvas cleared')}><span>⌫</span>Clear</button></div><div className="historyRow"><button type="button" onClick={undo} disabled={!undoStack.length}>↶ Undo</button><button type="button" onClick={redo} disabled={!redoStack.length}>Redo ↷</button></div><div className="rule" /><div className="speedControl"><div><span className="fieldLabel">Speed</span><strong>{speedName}</strong></div><div className="speedOptions">{Object.keys(SPEEDS).map((name) => <button type="button" className={speedName === name ? 'active' : ''} key={name} onClick={() => setSpeedName(name)} aria-label={`${name} speed`} />)}</div></div><div className="rule" /><div className="metrics"><div><span>Generation</span><strong>{generation.toLocaleString()}</strong></div><div><span>Living cells</span><strong>{alive}</strong></div></div><div className="rule" /><div className="generationHistory"><span className="fieldLabel">Recent population</span>{history.slice(-6).map((item) => <span key={`${item.generation}-${item.population}`}>G{item.generation}: <b>{item.population}</b></span>)}</div></aside>
    </div>
    <Timeline mode="finite" snapshots={snapshots} cursor={timelineCursor} onLimit={setRecordLimit} onBranch={() => setSnapshots((items) => items.slice(0, timelineCursor + 1))} onScrub={(index) => { const item = snapshots[index]; setRunning(false); setBoard(item.state); setGeneration(item.generation); setTimelineCursor(index); }} onImport={(items) => { setSnapshots(items); const last = items.length - 1; setTimelineCursor(last); setBoard(items[last].state); setGeneration(items[last].generation); }} />
    <PatternExplorer patterns={PATTERNS} onLoad={loadCells} />
    <PatternDesigner board={board} rows={gridRow} cols={gridCol} onReplace={(next, reason) => replaceBoard(next, reason)} onSave={savePattern} />
    <section className="patternStudio panel" aria-labelledby="pattern-studio-title"><div><span className="panelKicker">03 / SHARE</span><h2 id="pattern-studio-title">Pattern sharing studio</h2><p>Import standard B3/S23 RLE, export your active world, or keep custom patterns in this browser.</p></div><div className="rleWorkspace"><label>RLE pattern<textarea value={rleText} onChange={(event) => setRleText(event.target.value)} placeholder={'#N Glider\nx = 3, y = 3, rule = B3/S23\nbob$2bo$3o!'} /></label><div className="rleActions"><button type="button" onClick={importRle}>Import RLE</button><button type="button" onClick={makeExport}>Export active board</button><label>Pattern name<input value={saveName} maxLength="48" onChange={(event) => setSaveName(event.target.value)} /></label><button type="button" className="secondaryAction" onClick={savePattern}>Save in browser</button><small role="status">{rleMessage || 'Limits: 200 × 200, up to 10,000 cells.'}</small></div></div>{savedPatterns.length > 0 && <div className="savedPatterns"><span className="fieldLabel">Saved on this device</span>{savedPatterns.map((item) => <div key={item.id}><button type="button" onClick={() => { try { loadCells(item.name, parseRle(item.rle).cells); setRleMessage(`Loaded “${item.name}”.`); } catch (error) { setRleMessage(error.message); } }}>{item.name}</button><button type="button" className="deleteSaved" aria-label={`Delete ${item.name}`} onClick={() => erasePattern(item.id)}>×</button></div>)}</div>}</section>
    <VisualStudio board={board} onLoad={(cells) => replaceBoard(placePatternCentered(gridRow, gridCol, cells), 'Shared world loaded')} />
  </main>;
}
