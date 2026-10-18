const path = require('path');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const ROWS = 20; const COLS = 30; const SETUP_SECONDS = 20; const MAX_GENERATIONS = 30; const TICK_MS = 600;
const RECONNECT_GRACE_MS = 30000; const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000; const MAX_SPECTATORS = 8; const HISTORY_LIMIT = 24;
const operations = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];
const rooms = new Map();
const app = express(); const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || true } });
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/{*splat}', (_, response) => response.sendFile(path.join(__dirname, 'dist', 'index.html')));

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const safeName = (value) => String(value || 'Player').replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 18) || 'Player';
const score = (board, owner) => board.flat().filter((cell) => cell === owner).length;
const newCode = () => { let code; do { code = Math.random().toString(36).slice(2, 7).toUpperCase(); } while (rooms.has(code)); return code; };
const newToken = () => crypto.randomBytes(18).toString('hex');
function clearTimers(room) { clearTimeout(room.setupTimer); clearInterval(room.gameTimer); clearTimeout(room.cleanupTimer); room.setupTimer = null; room.gameTimer = null; room.cleanupTimer = null; }
function serialise(room) {
  const scores = { one: score(room.board, 1), two: score(room.board, 2) };
  const winner = room.phase === 'finished' ? (scores.one === scores.two ? 0 : scores.one > scores.two ? 1 : 2) : null;
  return { code: room.code, phase: room.phase, pausedPhase: room.pausedPhase, board: room.board, players: room.players.map(({ id, token, disconnectTimer, ...player }) => player), spectators: room.spectators.map(({ id, token, ...spectator }) => spectator), settings: room.settings, generation: room.generation, setupEndsAt: room.setupEndsAt, scores, winner, maxGenerations: room.settings.generations, history: room.history.slice(-5) };
}
const broadcast = (room) => io.to(room.code).emit('room:state', serialise(room));
function cleanupIfEmpty(room) { if (room.players.length) return; clearTimers(room); rooms.delete(room.code); }
function scheduleRoomExpiry(room) { clearTimeout(room.cleanupTimer); room.cleanupTimer = setTimeout(() => { if (room.phase === 'lobby' && room.players.length < 2) { clearTimers(room); rooms.delete(room.code); } }, EMPTY_ROOM_TTL_MS); }
function evolve(board) { return board.map((row, r) => row.map((cell, c) => { const neighbours = operations.map(([x, y]) => board[r + x]?.[c + y] || 0).filter(Boolean); if (neighbours.length === 3) return neighbours.filter((owner) => owner === 1).length >= neighbours.filter((owner) => owner === 2).length ? 1 : 2; return neighbours.length === 2 && cell ? cell : 0; })); }
function finish(room) { room.phase = 'finished'; clearInterval(room.gameTimer); room.gameTimer = null; room.history = [...room.history, { at: Date.now(), mode: room.settings.mode, scores: { one: score(room.board, 1), two: score(room.board, 2) }, generation: room.generation }].slice(-HISTORY_LIMIT); broadcast(room); }
function beginEvolution(room) { room.phase = 'playing'; room.pausedPhase = null; room.setupEndsAt = null; room.gameTimer = setInterval(() => { room.board = evolve(room.board); room.generation += 1; const total = score(room.board, 1) + score(room.board, 2); const territory = room.settings.mode === 'territory' && Math.abs(score(room.board, 1) - score(room.board, 2)) >= room.settings.territoryLead; const over = room.settings.mode === 'sandbox' ? room.generation >= room.settings.generations : room.generation >= room.settings.generations || total === 0 || territory; if (over) finish(room); else broadcast(room); }, TICK_MS); broadcast(room); }
function beginSetup(room, duration = SETUP_SECONDS * 1000) { if (room.players.length !== 2 || room.players.some((player) => !player.ready)) return; room.phase = 'setup'; room.pausedPhase = null; room.setupEndsAt = Date.now() + duration; room.setupTimer = setTimeout(() => beginEvolution(room), duration); broadcast(room); }
function pauseForDisconnect(room) { if (room.phase !== 'setup' && room.phase !== 'playing') return; room.pausedPhase = room.phase; room.remainingSetupMs = room.phase === 'setup' ? Math.max(0, room.setupEndsAt - Date.now()) : null; clearTimeout(room.setupTimer); clearInterval(room.gameTimer); room.setupTimer = null; room.gameTimer = null; room.phase = 'paused'; broadcast(room); }
function resumeIfReady(room) { if (!room.players.length || room.players.some((player) => !player.connected)) return; if (room.phase !== 'paused') return; if (room.pausedPhase === 'setup') beginSetup(room, room.remainingSetupMs || 1000); else if (room.pausedPhase === 'playing') beginEvolution(room); }
function addPlayer(room, socket, name) {
  const colors = [1, 2].filter((color) => !room.players.some((player) => player.color === color));
  if (!colors.length) return null;
  const player = { id: socket.id, token: newToken(), name: safeName(name), color: colors[0], host: !room.players.length, ready: false, connected: true, disconnectTimer: null };
  room.players.push(player); socket.join(room.code); socket.data.roomCode = room.code; socket.data.playerToken = player.token; return player;
}
function responseFor(room, player) { return { ok: true, code: room.code, player: { name: player.name, color: player.color, host: player.host }, token: player.token }; }

io.on('connection', (socket) => {
  socket.on('room:create', ({ name } = {}, respond = () => {}) => {
    const room = { code: newCode(), board: emptyBoard(), players: [], spectators: [], settings: { mode: 'survival', generations: MAX_GENERATIONS, territoryLead: 35 }, history: [], phase: 'lobby', pausedPhase: null, generation: 0, setupEndsAt: null, setupTimer: null, gameTimer: null, cleanupTimer: null };
    rooms.set(room.code, room); const player = addPlayer(room, socket, name); respond(responseFor(room, player)); broadcast(room); scheduleRoomExpiry(room);
  });
  socket.on('room:join', ({ code, name } = {}, respond = () => {}) => {
    const room = rooms.get(String(code || '').toUpperCase());
    if (!room) return respond({ ok: false, error: 'That room code does not exist or has expired.' });
    if (room.phase !== 'lobby') return respond({ ok: false, error: 'This match has already started.' });
    const player = addPlayer(room, socket, name); if (!player) return respond({ ok: false, error: 'This room already has two players.' });
    clearTimeout(room.cleanupTimer); respond(responseFor(room, player)); beginSetup(room);
  });
  socket.on('room:spectate', ({ code, name } = {}, respond = () => {}) => { const room = rooms.get(String(code || '').toUpperCase()); if (!room || room.spectators.length >= MAX_SPECTATORS) return respond({ ok: false, error: 'Spectator access is unavailable.' }); const spectator = { id: socket.id, token: newToken(), name: safeName(name), spectator: true }; room.spectators.push(spectator); socket.join(room.code); socket.data.roomCode = room.code; socket.data.spectatorToken = spectator.token; respond({ ok: true, code: room.code, player: spectator, token: spectator.token }); broadcast(room); });
  socket.on('room:settings', (settings = {}) => { const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken); if (!room || !player?.host || room.phase !== 'lobby') return; if (['survival', 'territory', 'sandbox'].includes(settings.mode)) room.settings.mode = settings.mode; if (Number.isInteger(settings.generations) && settings.generations >= 10 && settings.generations <= 150) room.settings.generations = settings.generations; if (Number.isInteger(settings.territoryLead) && settings.territoryLead >= 5 && settings.territoryLead <= 300) room.settings.territoryLead = settings.territoryLead; broadcast(room); });
  socket.on('room:ready', ({ ready } = {}) => { const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken); if (!room || !player || room.phase !== 'lobby') return; player.ready = Boolean(ready); broadcast(room); beginSetup(room); });
  socket.on('room:rematch', () => { const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken); if (!room || !player || room.phase !== 'finished') return; player.ready = true; if (room.players.every((entry) => entry.ready)) { room.board = emptyBoard(); room.generation = 0; room.players.forEach((entry) => { entry.ready = false; }); room.phase = 'lobby'; broadcast(room); } else broadcast(room); });
  socket.on('room:resume', ({ code, token } = {}, respond = () => {}) => {
    const room = rooms.get(String(code || '').toUpperCase()); const player = room && room.players.find((entry) => entry.token === token);
    if (!player) return respond({ ok: false, error: 'Your saved room session is no longer available.' });
    clearTimeout(player.disconnectTimer); player.id = socket.id; player.connected = true; socket.join(room.code); socket.data.roomCode = room.code; socket.data.playerToken = player.token; respond(responseFor(room, player)); broadcast(room); resumeIfReady(room);
  });
  socket.on('board:paint', ({ row, col, alive } = {}) => {
    const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken);
    if (!room || !player || room.phase !== 'setup' || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS || (socket.data.lastPaint && Date.now() - socket.data.lastPaint < 25)) return; socket.data.lastPaint = Date.now();
    if (!alive && room.board[row][col] !== player.color) return;
    if (alive && room.board[row][col] && room.board[row][col] !== player.color) return;
    room.board[row][col] = alive ? player.color : 0; broadcast(room);
  });
  socket.on('disconnect', () => {
    const spectatorRoom = rooms.get(socket.data.roomCode); if (socket.data.spectatorToken && spectatorRoom) { spectatorRoom.spectators = spectatorRoom.spectators.filter((entry) => entry.token !== socket.data.spectatorToken); broadcast(spectatorRoom); return; }
    const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken);
    if (!room || !player || player.id !== socket.id) return; player.connected = false; pauseForDisconnect(room);
    player.disconnectTimer = setTimeout(() => { room.players = room.players.filter((entry) => entry.token !== player.token); if (room.players.length) { room.phase = 'lobby'; room.pausedPhase = null; room.board = emptyBoard(); room.generation = 0; broadcast(room); scheduleRoomExpiry(room); } cleanupIfEmpty(room); }, RECONNECT_GRACE_MS);
    broadcast(room);
  });
});
const start = (port = PORT, callback) => server.listen(port, () => { console.log(`VOAI-CGOL multiplayer server listening on ${port}`); if (callback) callback(); });
const stop = (callback) => { rooms.forEach(clearTimers); rooms.clear(); io.close(() => server.close(callback)); };
if (require.main === module) start();
module.exports = { io, server, start, stop };
