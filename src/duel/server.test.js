// @vitest-environment node
const { io: connect } = require('socket.io-client');
const arena = require('../../server');

const waitUntil = (label, check, timeout = 2000) => new Promise((resolve, reject) => {
  const started = Date.now();
  const timer = setInterval(() => { if (check()) { clearInterval(timer); resolve(); } else if (Date.now() - started > timeout) { clearInterval(timer); reject(new Error(`Timed out waiting for ${label}.`)); } }, 20);
});
const acknowledge = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
const connectClient = (url) => new Promise((resolve, reject) => { const socket = connect(url, { transports: ['websocket'], timeout: 1500 }); socket.on('connect', () => resolve(socket)); socket.on('connect_error', reject); });

let url;
let started = false;
afterAll(() => started ? new Promise((resolve) => arena.stop(resolve)) : undefined);
const socketTest = process.env.RUN_SOCKET_TESTS === 'true' ? test : test.skip;

socketTest('arena pauses on a disconnect and resumes a saved player session', async () => {
  await new Promise((resolve) => arena.start(0, resolve)); started = true;
  url = `http://127.0.0.1:${arena.server.address().port}`;
  const first = await connectClient(url); const second = await connectClient(url);
  let state; first.on('room:state', (next) => { state = next; });
  const created = await acknowledge(first, 'room:create', { name: 'One' });
  const joined = await acknowledge(second, 'room:join', { code: created.code, name: 'Two' });
  first.emit('room:ready', { ready: true });
  second.emit('room:ready', { ready: true }); await waitUntil('setup', () => state?.phase === 'setup');
  second.disconnect(); await waitUntil('pause', () => state?.phase === 'paused');
  const resumedClient = await connectClient(url);
  expect(await acknowledge(resumedClient, 'room:resume', { code: created.code, token: joined.token })).toMatchObject({ ok: true, code: created.code });
  await waitUntil('resume', () => state?.phase === 'setup');
  first.disconnect(); resumedClient.disconnect();
});
