import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './game.scss';

const PATTERNS = {
    glider: { label: 'Glider', detail: 'A traveler that keeps moving.', cells: [[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]] },
    beacon: { label: 'Beacon', detail: 'A stable oscillator with two phases.', cells: [[1, 1], [1, 2], [2, 1], [2, 2], [3, 3], [3, 4], [4, 3], [4, 4]] },
    pulsar: { label: 'Pulsar', detail: 'A hypnotic period-three oscillator.', cells: [[2, 4], [2, 5], [2, 6], [2, 10], [2, 11], [2, 12], [4, 2], [4, 7], [4, 9], [4, 14], [5, 2], [5, 7], [5, 9], [5, 14], [6, 2], [6, 7], [6, 9], [6, 14], [7, 4], [7, 5], [7, 6], [7, 10], [7, 11], [7, 12], [9, 4], [9, 5], [9, 6], [9, 10], [9, 11], [9, 12], [10, 2], [10, 7], [10, 9], [10, 14], [11, 2], [11, 7], [11, 9], [11, 14], [12, 2], [12, 7], [12, 9], [12, 14], [14, 4], [14, 5], [14, 6], [14, 10], [14, 11], [14, 12]] },
    blinker: { label: 'Blinker', detail: 'The simplest moving oscillator.', cells: [[2, 1], [2, 2], [2, 3]] },
    block: { label: 'Block', detail: 'A quiet, unchanging still life.', cells: [[1, 1], [1, 2], [2, 1], [2, 2]] },
};

const SPEEDS = { slow: 900, balanced: 500, fast: 180 };
const HISTORY_LIMIT = 40;
const boardsMatch = (first, second) => first.every((row, rowIndex) => row.every((cell, colIndex) => cell === second[rowIndex][colIndex]));

function MiniPattern({ cells }) {
    return <div className="miniPattern">{Array.from({ length: 25 }, (_, index) => <i className={cells.some(([row, col]) => row * 5 + col === index) ? 'on' : ''} key={index} />)}</div>;
}

const Game = ({ gridRow = 20, gridCol = 30, operations }) => {
    const emptyBoard = useCallback(() => Array.from({ length: gridRow }, () => Array(gridCol).fill(0)), [gridRow, gridCol]);
    const [board, setBoard] = useState(emptyBoard);
    const [generation, setGeneration] = useState(0);
    const [running, setRunning] = useState(false);
    const [speedName, setSpeedName] = useState('balanced');
    const [selectedPattern, setSelectedPattern] = useState('glider');
    const [wrapEdges, setWrapEdges] = useState(false);
    const [stopReason, setStopReason] = useState('Ready to experiment');
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const historyRef = useRef(new Map());
    const paintValueRef = useRef(null);
    const alive = useMemo(() => board.flat().filter(Boolean).length, [board]);
    const speed = SPEEDS[speedName];

    const resetRepeatTracking = () => { historyRef.current = new Map(); };
    const recordSnapshot = useCallback(() => {
        setUndoStack((stack) => [...stack, { board, generation }].slice(-HISTORY_LIMIT));
        setRedoStack([]);
    }, [board, generation]);

    const nextGeneration = useCallback((current) => current.map((row, i) => row.map((cell, j) => {
        const neighbors = operations.reduce((count, [x, y]) => {
            const rowIndex = wrapEdges ? (i + x + gridRow) % gridRow : i + x;
            const colIndex = wrapEdges ? (j + y + gridCol) % gridCol : j + y;
            return count + (current[rowIndex]?.[colIndex] || 0);
        }, 0);
        return neighbors === 3 || (cell && neighbors === 2) ? 1 : 0;
    })), [gridCol, gridRow, operations, wrapEdges]);

    const step = useCallback(() => {
        setBoard((current) => {
            const next = nextGeneration(current);
            if (boardsMatch(current, next)) {
                setRunning(false);
                setStopReason('Paused: stable board detected');
                return next;
            }
            const signature = JSON.stringify(next);
            const occurrences = (historyRef.current.get(signature) || 0) + 1;
            historyRef.current.set(signature, occurrences);
            if (occurrences >= 5) {
                setRunning(false);
                setStopReason('Paused: a board state repeated five times');
            } else {
                setStopReason('Evolving');
            }
            return next;
        });
        setGeneration((value) => value + 1);
    }, [nextGeneration]);

    const toggleRunning = () => {
        if (running) {
            setRunning(false);
            setStopReason('Paused manually');
            return;
        }
        resetRepeatTracking();
        setRunning(true);
        setStopReason('Evolving');
    };

    useEffect(() => {
        if (!running) return undefined;
        const timer = window.setInterval(step, speed);
        return () => window.clearInterval(timer);
    }, [running, speed, step]);

    useEffect(() => {
        const stopPainting = () => { paintValueRef.current = null; };
        window.addEventListener('mouseup', stopPainting);
        return () => window.removeEventListener('mouseup', stopPainting);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target !== document.body) return;
            if (event.code === 'Space') { event.preventDefault(); setRunning((value) => !value); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const clear = () => { recordSnapshot(); resetRepeatTracking(); setRunning(false); setGeneration(0); setBoard(emptyBoard()); setStopReason('Canvas cleared'); };
    const randomize = () => { recordSnapshot(); resetRepeatTracking(); setRunning(false); setGeneration(0); setBoard(() => Array.from({ length: gridRow }, () => Array.from({ length: gridCol }, () => Math.random() > 0.77 ? 1 : 0))); setStopReason('New random world'); };
    const loadPattern = (name) => {
        recordSnapshot(); resetRepeatTracking(); setSelectedPattern(name); setRunning(false); setGeneration(0);
        const next = emptyBoard();
        PATTERNS[name].cells.forEach(([row, col]) => {
            const targetRow = Math.floor(gridRow / 2) - 7 + row;
            const targetCol = Math.floor(gridCol / 2) - 7 + col;
            if (next[targetRow]?.[targetCol] !== undefined) next[targetRow][targetCol] = 1;
        });
        setBoard(next);
        setStopReason(`${PATTERNS[name].label} loaded`);
    };
    const undo = () => {
        if (!undoStack.length) return;
        const previous = undoStack[undoStack.length - 1];
        setRedoStack((stack) => [...stack, { board, generation }].slice(-HISTORY_LIMIT));
        setUndoStack((stack) => stack.slice(0, -1));
        resetRepeatTracking(); setRunning(false); setBoard(previous.board); setGeneration(previous.generation); setStopReason('Undid last edit');
    };
    const redo = () => {
        if (!redoStack.length) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack((stack) => [...stack, { board, generation }].slice(-HISTORY_LIMIT));
        setRedoStack((stack) => stack.slice(0, -1));
        resetRepeatTracking(); setRunning(false); setBoard(next.board); setGeneration(next.generation); setStopReason('Redid last edit');
    };
    const paintCell = (row, col, value) => setBoard((current) => current.map((line, i) => line.map((cell, j) => i === row && j === col ? value : cell)));
    const startPainting = (event, row, col) => {
        event.preventDefault();
        recordSnapshot(); resetRepeatTracking(); setRunning(false);
        paintValueRef.current = board[row][col] ? 0 : 1;
        paintCell(row, col, paintValueRef.current);
        setStopReason('Board edited');
    };
    const continuePainting = (row, col) => {
        if (paintValueRef.current === null) return;
        paintCell(row, col, paintValueRef.current);
    };

    return <main className="simulatorShell">
        <header className="simHeader"><div><p className="sectionLabel">LIVE SIMULATION</p><h1>Make something <em>alive.</em></h1><p>Draw a starting world, then watch simple rules create impossible complexity.</p></div><div className={`status ${running ? 'isLive' : ''}`}><span />{running ? 'Running' : 'Paused'}<small>{stopReason}</small></div></header>
        <div className="workspace">
            <aside className="libraryPanel panel"><div className="panelTitle"><div><span className="panelKicker">01 / EXPERIMENT</span><h2>Pattern library</h2></div><button className="iconButton" type="button" aria-label="Search patterns">⌕</button></div><p className="panelIntro">Start with a classic, or draw your own from scratch.</p><div className="patternList">{Object.entries(PATTERNS).slice(0, 3).map(([name, pattern]) => <button type="button" className={`patternCard ${selectedPattern === name ? 'selected' : ''}`} key={name} onClick={() => loadPattern(name)}><MiniPattern cells={pattern.cells} /><span><strong>{pattern.label}</strong><small>{pattern.detail}</small></span><b>↗</b></button>)}</div><div className="quickPatterns">{Object.entries(PATTERNS).slice(3).map(([name, pattern]) => <button type="button" className={selectedPattern === name ? 'selected' : ''} key={name} onClick={() => loadPattern(name)}><MiniPattern cells={pattern.cells} /><span>{pattern.label}</span></button>)}</div><button className="resetLink" type="button" onClick={clear}>+ New empty canvas</button></aside>
            <section className="canvasPanel"><div className="canvasTopline"><span>CANVAS / {gridCol} × {gridRow}</span><span className="canvasHint">Click or drag to compose</span></div><div className="canvasFrame"><div className="board" role="grid" aria-label="Game of Life board" style={{ gridTemplateColumns: `repeat(${gridCol}, minmax(8px, 1fr))` }}>{board.map((row, i) => row.map((cell, j) => <button type="button" role="gridcell" aria-label={`Row ${i + 1}, column ${j + 1}, ${cell ? 'alive' : 'dead'}`} className={`cell${cell ? ' alive' : ''}`} key={`${i}-${j}`} onMouseDown={(event) => startPainting(event, i, j)} onMouseEnter={() => continuePainting(i, j)} />))}</div></div><div className="canvasFooter"><span><i className="keyDot" /> {alive} living cells</span><span>Space play/pause · click or drag to edit</span></div></section>
            <aside className="inspectorPanel panel"><div className="panelTitle"><div><span className="panelKicker">02 / CONTROL</span><h2>Simulation</h2></div><button className={`edgeToggle ${wrapEdges ? 'enabled' : ''}`} type="button" aria-pressed={wrapEdges} onClick={() => { setWrapEdges((value) => !value); resetRepeatTracking(); setStopReason(`Edge wrap ${wrapEdges ? 'off' : 'on'}`); }}>↻ Wrap</button></div><button className={`playButton ${running ? 'playing' : ''}`} type="button" onClick={toggleRunning}><span>{running ? 'Ⅱ' : '▶'}</span>{running ? 'Pause simulation' : 'Play simulation'}</button><div className="controlRow"><button type="button" onClick={step} disabled={running}><span>»</span>Step</button><button type="button" onClick={randomize}><span>⤨</span>Randomize</button><button type="button" onClick={clear}><span>⌫</span>Clear</button></div><div className="historyRow"><button type="button" onClick={undo} disabled={!undoStack.length}>↶ Undo</button><button type="button" onClick={redo} disabled={!redoStack.length}>Redo ↷</button></div><div className="rule" /><div className="speedControl"><div><span className="fieldLabel">Speed</span><strong>{speedName === 'balanced' ? 'Balanced' : speedName === 'fast' ? 'Fast' : 'Slow'}</strong></div><div className="speedOptions">{Object.keys(SPEEDS).map((name) => <button type="button" className={speedName === name ? 'active' : ''} key={name} onClick={() => setSpeedName(name)} aria-label={`${name} speed`} />)}</div></div><div className="rule" /><div className="metrics"><div><span>Generation</span><strong>{generation.toLocaleString()}</strong></div><div><span>Living cells</span><strong>{alive}</strong></div></div><div className="rule" /><div className="rules"><span className="fieldLabel">The rules</span><p>A cell is born with exactly <b>3</b> neighbours.</p><p>It survives with <b>2 or 3</b> neighbours.</p><p>Otherwise, the cell dies.</p></div></aside>
        </div>
    </main>;
};

export default Game;
