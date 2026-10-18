import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './duel.scss';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:3001` : window.location.origin);
const SESSION_KEY = 'voai-cgol.duel-session.v1';

const labelForPhase = { lobby: 'Waiting for challenger', setup: 'Build your opening', playing: 'Life is evolving', paused: 'Waiting to reconnect', finished: 'Match complete' };

export default function Duel() {
    const socketRef = useRef(null);
    const paintValueRef = useRef(null);
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [room, setRoom] = useState(null);
    const [player, setPlayer] = useState(null);
    const [error, setError] = useState('');
    const [now, setNow] = useState(Date.now());
    const [connection, setConnection] = useState('connecting');
    const [mode, setMode] = useState('survival');
    const [spectating, setSpectating] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, { autoConnect: false });
        socketRef.current = socket;
        socket.on('room:state', setRoom);
        socket.on('connect', () => {
            setConnection('connected');
            let saved = null;
            try { saved = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { window.localStorage.removeItem(SESSION_KEY); }
            if (saved) socket.emit('room:resume', saved, (result) => {
                if (result.ok) { setPlayer(result.player); setRoomCode(result.code); }
                else window.localStorage.removeItem(SESSION_KEY);
            });
        });
        socket.on('disconnect', () => setConnection('reconnecting'));
        socket.on('connect_error', () => { setConnection('offline'); setError('Cannot reach the multiplayer server. Check that it is running, then retry.'); });
        socket.connect();
        return () => socket.disconnect();
    }, []);
    useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer); }, []);
    useEffect(() => { const stopPainting = () => { paintValueRef.current = null; }; window.addEventListener('mouseup', stopPainting); return () => window.removeEventListener('mouseup', stopPainting); }, []);

    const rememberSession = (result) => window.localStorage.setItem(SESSION_KEY, JSON.stringify({ code: result.code, token: result.token }));
    const createRoom = () => {
        setError('');
        if (!socketRef.current?.connected) return setError('Connecting to the multiplayer server…');
        socketRef.current.emit('room:create', { name }, (result) => {
            if (!result.ok) return setError(result.error);
            rememberSession(result);
            setPlayer(result.player);
            setRoomCode(result.code);
            socketRef.current.emit('room:settings', { mode });
        });
    };
    const joinRoom = () => {
        setError('');
        if (!socketRef.current?.connected) return setError('Connecting to the multiplayer server…');
        socketRef.current.emit('room:join', { code: roomCode, name }, (result) => {
            if (!result.ok) return setError(result.error);
            rememberSession(result);
            setPlayer(result.player);
            setRoomCode(result.code);
        });
    };
    const spectateRoom = () => { socketRef.current.emit('room:spectate', { code: roomCode, name }, (result) => { if (!result.ok) return setError(result.error); setSpectating(true); setPlayer(result.player); setRoomCode(result.code); }); };
    const paint = (row, col, desired) => socketRef.current.emit('board:paint', { row, col, alive: desired });
    const startPainting = (event, row, col) => {
        if (!room || room.phase !== 'setup' || !player) return;
        event.preventDefault();
        const cell = room.board[row][col];
        if (cell && cell !== player.color) return;
        paintValueRef.current = cell === player.color ? false : true;
        paint(row, col, paintValueRef.current);
    };
    const continuePainting = (row, col) => {
        if (paintValueRef.current === null || !room || room.phase !== 'setup' || !player) return;
        const cell = room.board[row][col];
        if (cell && cell !== player.color) return;
        paint(row, col, paintValueRef.current);
    };

    const setupSeconds = room && room.setupEndsAt ? Math.max(0, Math.ceil((room.setupEndsAt - now) / 1000)) : 0;
    const myScore = room && player ? (player.color === 1 ? room.scores.one : room.scores.two) : 0;
    const opponentScore = room && player ? (player.color === 1 ? room.scores.two : room.scores.one) : 0;
    const winnerText = room && room.phase === 'finished' && player ? (room.winner === 0 ? 'It’s a draw.' : room.winner === player.color ? 'You win the duel.' : 'Your opponent wins.') : '';

    if (!player) return <main className="duelLanding"><section><p className="sectionLabel">MULTIPLAYER ARENA · {connection}</p><h1>Bring a rival.<br /><em>Grow a world.</em></h1><p className="duelLead">Choose Survival, Territory, or Sandbox Co-op. Players ready up before every match; spectators can watch live.</p><div className="matchForm"><label>Your display name<input value={name} maxLength="18" onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label><label>Mode<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="survival">Survival Duel</option><option value="territory">Territory Control</option><option value="sandbox">Sandbox Co-op</option></select></label><button type="button" disabled={connection !== 'connected'} onClick={createRoom}>Create arena</button><div className="formDivider"><span>or</span></div><label>Room code<input value={roomCode} maxLength="5" onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="ABCDE" /></label><button className="secondary" type="button" disabled={connection !== 'connected'} onClick={joinRoom}>Join as player</button><button className="secondary" type="button" disabled={connection !== 'connected'} onClick={spectateRoom}>Spectate</button>{error && <p className="formError" role="alert">{error}</p>}</div></section><aside><span>ARENA MODES</span><ol><li><b>01</b>Survival: highest living population wins.</li><li><b>02</b>Territory: build a decisive population lead.</li><li><b>03</b>Sandbox: co-create through the configured limit.</li></ol></aside></main>;

    const opponent = room && room.players.find((entry) => entry.color !== player.color);
    if (room?.phase === 'lobby') return <main className="duelShell"><header className="duelHeader"><div><p className="sectionLabel">ARENA / {roomCode}</p><h1>{room.settings?.mode || 'survival'} <em>lobby.</em></h1></div></header><section className="arenaLobby"><p>Mode: <b>{room.settings?.mode}</b> · {room.players.length}/2 players · {room.spectators?.length || 0}/8 spectators</p>{room.players.map((entry) => <div key={entry.color}>{entry.name} - {entry.ready ? 'Ready' : 'Waiting'}</div>)}{!spectating && <button type="button" onClick={() => socketRef.current.emit('room:ready', { ready: true })}>Ready for match</button>}{player.host && <label>Generations<select defaultValue={room.settings?.generations} onChange={(event) => socketRef.current.emit('room:settings', { generations: Number(event.target.value) })}><option value="20">20</option><option value="30">30</option><option value="60">60</option></select></label>}<p>Share this code with a player or spectator: <strong>{roomCode}</strong></p></section></main>;
    return <main className="duelShell"><header className="duelHeader"><div><p className="sectionLabel">ARENA / {roomCode}</p><h1>{room?.settings?.mode || 'survival'} <em>arena.</em></h1></div><div className="duelStatus" aria-live="polite"><span className={`phaseDot ${room?.phase}`} />{room?.phase === 'paused' ? 'Waiting to reconnect' : labelForPhase[room?.phase] || connection}<small>{room?.phase === 'setup' ? `${setupSeconds}s remaining` : room?.phase === 'playing' ? `Generation ${room.generation} of ${room.maxGenerations}` : winnerText || `${room?.spectators?.length || 0} spectators`}</small></div></header><div className="duelWorkspace"><aside className="duelPanel roster"><span className="panelKicker">LIVE SCOREBOARD</span><div className={`playerTile mine color${player.color || 1}`}><span className="playerColor" /><div><small>{spectating ? 'SPECTATING' : 'YOU'}</small><strong>{player.name}</strong></div><b>{myScore}</b></div><div className={`playerTile color${player.color === 1 ? 2 : 1}`}><span className="playerColor" /><div><small>OPPONENT</small><strong>{opponent?.name || 'Waiting…'} {opponent && !opponent.connected ? '(reconnecting)' : ''}</strong></div><b>{opponent ? opponentScore : '-'}</b></div><div className="duelRule" /><p>{spectating ? 'Read-only spectator view.' : 'Living cells are your score. During setup, you may only place or remove your own color.'}</p>{room?.phase === 'finished' && !spectating && <button className="rematch" type="button" onClick={() => socketRef.current.emit('room:rematch')}>Ready for rematch</button>}<div className="roomCode"><span>SHARE CODE · {room?.spectators?.length || 0} WATCHING</span><strong>{roomCode}</strong></div></aside><section className="duelCanvas"><div className="duelCanvasTop"><span>{spectating ? 'SPECTATOR' : `PLAYER ${player.color}`} / {room?.phase === 'setup' ? 'BUILD PHASE' : 'LIVE BOARD'}</span><span>{room?.phase === 'finished' ? winnerText : room?.settings?.mode}</span></div><div className="duelBoard" role="grid" aria-label="Multiplayer Game of Life board" style={{ gridTemplateColumns: 'repeat(30, minmax(8px, 1fr))' }}>{room?.board.map((row, rowIndex) => row.map((cell, colIndex) => <button type="button" role="gridcell" key={`${rowIndex}-${colIndex}`} className={`duelCell owner${cell}`} aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${cell === 0 ? 'empty' : `owned by player ${cell}`}`} onMouseDown={(event) => startPainting(event, rowIndex, colIndex)} onMouseEnter={() => continuePainting(rowIndex, colIndex)} />))}</div><div className="duelLegend"><span><i className="one" /> One: {room?.scores?.one || 0}</span><span><i className="two" /> Two: {room?.scores?.two || 0}</span><span>Generation {room?.generation || 0}/{room?.maxGenerations || 30}</span></div></section></div></main>;
}
