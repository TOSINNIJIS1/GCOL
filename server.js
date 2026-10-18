const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const ROWS = 20;
const COLS = 30;
const SETUP_SECONDS = 20;
const MAX_GENERATIONS = 30;
const TICK_MS = 600;
const rooms = new Map();
const operations = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || true } });

app.use(express.static(path.join(__dirname, 'build')));
app.get('/{*splat}', (_, response) => response.sendFile(path.join(__dirname, 'build', 'index.html')));

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const roomCode = () => {
  let code;
  do code = Math.random().toString(36).slice(2, 7).toUpperCase(); while (rooms.has(code));
  return code;
};
const safeName = (name) => String(name || 'Player').replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 18) || 'Player';
const score = (board, owner) => board.flat().filter((cell) => cell === owner).length;

function serialise(room) {
  const scores = { one: score(room.board, 1), two: score(room.board, 2) };
  const winner = room.phase === 'finished' ? (scores.one === scores.two ? 0 : scores.one > scores.two ? 1 : 2) : null;
  return { code: room.code, phase: room.phase, board: room.board, players: room.players.map(({ id, ...player }) => player), generation: room.generation, setupEndsAt: room.setupEndsAt, scores, winner, maxGenerations: MAX_GENERATIONS };
}
function broadcast(room) { io.to(room.code).emit('room:state', serialise(room)); }
function stopTimers(room) { clearTimeout(room.setupTimer); clearInterval(room.gameTimer); room.setupTimer = null; room.gameTimer = null; }

function evolve(board) {
  return board.map((row, rowIndex) => row.map((cell, colIndex) => {
    const neighbors = operations.map(([x, y]) => board[rowIndex + x]?.[colIndex + y] || 0).filter(Boolean);
    if (neighbors.length === 3) {
      const first = neighbors.filter((owner) => owner === 1).length;
      const second = neighbors.filter((owner) => owner === 2).length;
      return first >= second ? 1 : 2;
    }
    return neighbors.length === 2 && cell ? cell : 0;
  }));
}
function beginEvolution(room) {
  room.phase = 'playing';
  room.setupEndsAt = null;
  room.gameTimer = setInterval(() => {
    room.board = evolve(room.board);
    room.generation += 1;
    if (room.generation >= MAX_GENERATIONS || score(room.board, 1) + score(room.board, 2) === 0) {
      room.phase = 'finished';
      clearInterval(room.gameTimer);
    }
    broadcast(room);
  }, TICK_MS);
  broadcast(room);
}
function beginSetup(room) {
  if (room.phase !== 'lobby' || room.players.length !== 2) return;
  room.phase = 'setup';
  room.setupEndsAt = Date.now() + SETUP_SECONDS * 1000;
  room.setupTimer = setTimeout(() => beginEvolution(room), SETUP_SECONDS * 1000);
  broadcast(room);
}
function addPlayer(room, socket, name) {
  if (room.players.length >= 2) return null;
  const player = { id: socket.id, name: safeName(name), color: room.players.length === 0 ? 1 : 2, host: room.players.length === 0 };
  room.players.push(player);
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.playerColor = player.color;
  return player;
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name }, respond) => {
    const code = roomCode();
    const room = { code, board: emptyBoard(), players: [], phase: 'lobby', generation: 0, setupEndsAt: null, setupTimer: null, gameTimer: null };
    rooms.set(code, room);
    const player = addPlayer(room, socket, name);
    respond({ ok: true, code, player });
    broadcast(room);
  });

  socket.on('room:join', ({ code, name }, respond) => {
    const room = rooms.get(String(code || '').toUpperCase());
    if (!room) return respond({ ok: false, error: 'That room code does not exist.' });
    if (room.phase !== 'lobby') return respond({ ok: false, error: 'This match has already started.' });
    const player = addPlayer(room, socket, name);
    if (!player) return respond({ ok: false, error: 'This room already has two players.' });
    respond({ ok: true, code: room.code, player });
    beginSetup(room);
  });

  socket.on('board:paint', ({ row, col, alive }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'setup' || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const owner = socket.data.playerColor;
    if (!alive && room.board[row][col] !== owner) return;
    if (alive && room.board[row][col] && room.board[row][col] !== owner) return;
    room.board[row][col] = alive ? owner : 0;
    broadcast(room);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.players = room.players.filter((player) => player.id !== socket.id);
    if (!room.players.length) { stopTimers(room); rooms.delete(room.code); return; }
    room.phase = 'lobby';
    stopTimers(room);
    broadcast(room);
  });
});

server.listen(PORT, () => console.log(`VOAI-CGOL multiplayer server listening on ${PORT}`));
