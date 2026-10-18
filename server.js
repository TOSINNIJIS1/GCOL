const path = require('path');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const ROWS = 20; const COLS = 30; const SETUP_SECONDS = 20; const MAX_GENERATIONS = 30; const TICK_MS = 600;
const RECONNECT_GRACE_MS = 30000; const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;
const operations = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];
const rooms = new Map();
const app = express(); const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || true } });
app.use(express.static(path.join(__dirname, 'build')));
app.get('/{*splat}', (_, response) => response.sendFile(path.join(__dirname, 'build', 'index.html')));

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const safeName = (value) => String(value || 'Player').replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 18) || 'Player';
const score = (board, owner) => board.flat().filter((cell) => cell === owner).length;
const newCode = () => { let code; do { code = Math.random().toString(36).slice(2, 7).toUpperCase(); } while (rooms.has(code)); return code; };
const newToken = () => crypto.randomBytes(18).toString('hex');
function clearTimers(room) { clearTimeout(room.setupTimer); clearInterval(room.gameTimer); clearTimeout(room.cleanupTimer); room.setupTimer = null; room.gameTimer = null; room.cleanupTimer = null; }
function serialise(room) {
  const scores = { one: score(room.board, 1), two: score(room.board, 2) };
  const winner = room.phase === 'finished' ? (scores.one === scores.two ? 0 : scores.one > scores.two ? 1 : 2) : null;
  return { code: room.code, phase: room.phase, pausedPhase: room.pausedPhase, board: room.board, players: room.players.map(({ id, token, disconnectTimer, ...player }) => player), generation: room.generation, setupEndsAt: room.setupEndsAt, scores, winner, maxGenerations: MAX_GENERATIONS };
}
const broadcast = (room) => io.to(room.code).emit('room:state', serialise(room));
function cleanupIfEmpty(room) { if (room.players.length) return; clearTimers(room); rooms.delete(room.code); }
function scheduleRoomExpiry(room) { clearTimeout(room.cleanupTimer); room.cleanupTimer = setTimeout(() => { if (room.phase === 'lobby' && room.players.length < 2) { clearTimers(room); rooms.delete(room.code); } }, EMPTY_ROOM_TTL_MS); }
function evolve(board) { return board.map((row, r) => row.map((cell, c) => { const neighbours = operations.map(([x, y]) => board[r + x]?.[c + y] || 0).filter(Boolean); if (neighbours.length === 3) return neighbours.filter((owner) => owner === 1).length >= neighbours.filter((owner) => owner === 2).length ? 1 : 2; return neighbours.length === 2 && cell ? cell : 0; })); }
function beginEvolution(room) { room.phase = 'playing'; room.pausedPhase = null; room.setupEndsAt = null; room.gameTimer = setInterval(() => { room.board = evolve(room.board); room.generation += 1; if (room.generation >= MAX_GENERATIONS || score(room.board, 1) + score(room.board, 2) === 0) { room.phase = 'finished'; clearInterval(room.gameTimer); room.gameTimer = null; } broadcast(room); }, TICK_MS); broadcast(room); }
function beginSetup(room, duration = SETUP_SECONDS * 1000) { if (room.players.length !== 2) return; room.phase = 'setup'; room.pausedPhase = null; room.setupEndsAt = Date.now() + duration; room.setupTimer = setTimeout(() => beginEvolution(room), duration); broadcast(room); }
function pauseForDisconnect(room) { if (room.phase !== 'setup' && room.phase !== 'playing') return; room.pausedPhase = room.phase; room.remainingSetupMs = room.phase === 'setup' ? Math.max(0, room.setupEndsAt - Date.now()) : null; clearTimeout(room.setupTimer); clearInterval(room.gameTimer); room.setupTimer = null; room.gameTimer = null; room.phase = 'paused'; broadcast(room); }
function resumeIfReady(room) { if (!room.players.length || room.players.some((player) => !player.connected)) return; if (room.phase !== 'paused') return; if (room.pausedPhase === 'setup') beginSetup(room, room.remainingSetupMs || 1000); else if (room.pausedPhase === 'playing') beginEvolution(room); }
function addPlayer(room, socket, name) {
  const colors = [1, 2].filter((color) => !room.players.some((player) => player.color === color));
  if (!colors.length) return null;
  const player = { id: socket.id, token: newToken(), name: safeName(name), color: colors[0], host: !room.players.length, connected: true, disconnectTimer: null };
  room.players.push(player); socket.join(room.code); socket.data.roomCode = room.code; socket.data.playerToken = player.token; return player;
}
function responseFor(room, player) { return { ok: true, code: room.code, player: { name: player.name, color: player.color, host: player.host }, token: player.token }; }

io.on('connection', (socket) => {
  socket.on('room:create', ({ name } = {}, respond = () => {}) => {
    const room = { code: newCode(), board: emptyBoard(), players: [], phase: 'lobby', pausedPhase: null, generation: 0, setupEndsAt: null, setupTimer: null, gameTimer: null, cleanupTimer: null };
    rooms.set(room.code, room); const player = addPlayer(room, socket, name); respond(responseFor(room, player)); broadcast(room); scheduleRoomExpiry(room);
  });
  socket.on('room:join', ({ code, name } = {}, respond = () => {}) => {
    const room = rooms.get(String(code || '').toUpperCase());
    if (!room) return respond({ ok: false, error: 'That room code does not exist or has expired.' });
    if (room.phase !== 'lobby') return respond({ ok: false, error: 'This match has already started.' });
    const player = addPlayer(room, socket, name); if (!player) return respond({ ok: false, error: 'This room already has two players.' });
    clearTimeout(room.cleanupTimer); respond(responseFor(room, player)); beginSetup(room);
  });
  socket.on('room:resume', ({ code, token } = {}, respond = () => {}) => {
    const room = rooms.get(String(code || '').toUpperCase()); const player = room && room.players.find((entry) => entry.token === token);
    if (!player) return respond({ ok: false, error: 'Your saved room session is no longer available.' });
    clearTimeout(player.disconnectTimer); player.id = socket.id; player.connected = true; socket.join(room.code); socket.data.roomCode = room.code; socket.data.playerToken = player.token; respond(responseFor(room, player)); broadcast(room); resumeIfReady(room);
  });
  socket.on('board:paint', ({ row, col, alive } = {}) => {
    const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken);
    if (!room || !player || room.phase !== 'setup' || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    if (!alive && room.board[row][col] !== player.color) return;
    if (alive && room.board[row][col] && room.board[row][col] !== player.color) return;
    room.board[row][col] = alive ? player.color : 0; broadcast(room);
  });
  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode); const player = room && room.players.find((entry) => entry.token === socket.data.playerToken);
    if (!room || !player || player.id !== socket.id) return; player.connected = false; pauseForDisconnect(room);
    player.disconnectTimer = setTimeout(() => { room.players = room.players.filter((entry) => entry.token !== player.token); if (room.players.length) { room.phase = 'lobby'; room.pausedPhase = null; room.board = emptyBoard(); room.generation = 0; broadcast(room); scheduleRoomExpiry(room); } cleanupIfEmpty(room); }, RECONNECT_GRACE_MS);
    broadcast(room);
  });
});
server.listen(PORT, () => console.log(`VOAI-CGOL multiplayer server listening on ${PORT}`));
