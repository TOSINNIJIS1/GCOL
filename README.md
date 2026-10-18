# VOAI-CGOL - Conway's Game of Life Studio

VOAI-CGOL is a browser-based Conway's Game of Life studio. It combines a reliable B3/S23 engine, finite and sparse infinite worlds, pattern tools, replay analytics, visual sharing, and an online Socket.IO arena.

## Studio features

- Accurate Conway B3/S23 evolution with fixed edges or optional edge wrapping.
- Play, pause, single-step, clear, randomize, undo, redo, speed controls, population count, and generation history.
- Automatic pausing for a stable world or once the same board state has occurred five times.
- Centered presets: Glider, Beacon, Pulsar, Blinker, and Block work on any board dimensions.
- Draw using a mouse, touch, or keyboard. `Space` plays/pauses, `S` steps, and `R` resets; arrow keys move focus across the board and `Enter`/`Space` edits a focused cell.
- Standard RLE import/export with B3/S23 validation, a 200 × 200 pattern bound, and a 10,000-cell limit.
- Save up to 24 custom RLE patterns in the browser’s local storage.
- Private online 1v1 duels with room codes, synchronized boards, reconnect grace time, room expiry, and connection feedback.
- Infinite sparse worlds with pan, zoom, bounded simulation work, visible-viewport PNG exports, and validated sharing links.
- Timeline replay with bounded JSON recordings, pattern explorer/designer tools, persistent themes, and reduced-motion support.

## Development

Requirements: Node.js 22 and npm 10+.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The client uses Vite; no OpenSSL compatibility flag is required.

### Netlify deployment

The repository includes `netlify.toml`. Netlify should use Node 22, run `npm run build`, and publish `dist`. The SPA rewrite in that file keeps React Router routes working on refresh. Netlify hosts the Vite client only. The Socket.IO server must run separately on a Node host that supports long-lived WebSocket connections; set the deployed client’s `VITE_SOCKET_URL` to that server URL.

### Online multiplayer

Run the client and realtime service in separate terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

The client connects to `http://localhost:3001` in development. For a separate public server, set `VITE_SOCKET_URL` before starting or building the client. During a duel, an active match pauses if either player disconnects and resumes automatically when both reconnect within 30 seconds. Inactive one-player rooms expire after 10 minutes.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run server` | Start the Socket.IO duel server on port 3001. |
| `npm run serve` | Build the client and serve it with the Socket.IO server. |
| `npm test` | Run the Vitest unit and component suite. |
| `RUN_SOCKET_TESTS=true npm test` | Also run Socket.IO lifecycle integration tests (where loopback sockets are permitted). |
| `npm run build` | Produce an optimized `dist/` production build. |

## RLE sharing

Use the **Pattern sharing studio** below the simulator to import, export, and locally save patterns. Imported RLE must contain a valid `x = …, y = …` header, end in `!`, and use the Conway `B3/S23` rule. Example:

```text
#N Glider
x = 3, y = 3, rule = B3/S23
bob$2bo$3o!
```

Exports crop empty borders so patterns are portable. Saved patterns stay only in the current browser profile; clearing browser site data removes them.

## Rules

Each cell is evaluated from the previous generation at the same time:

1. A dead cell with exactly three living neighbors is born.
2. A living cell with two or three living neighbors survives.
3. Every other cell dies or remains dead.

The simulator pauses automatically when a board is unchanged or when a complete board state has appeared five times. Editing, loading, randomizing, clearing, undoing, redoing, and toggling edge wrapping resets repeat tracking.

## Tests

The automated suite covers UI painting/undo, finite and sparse evolution, RLE validation/round-tripping, recordings, and bounded world sharing. Socket.IO reconnect lifecycle coverage runs when loopback sockets are available.

## Project map

```text
src/game/life.js   # B3/S23 engine, board helpers, centered placement
src/game/rle.js    # RLE import/export and validation
src/game/game.js   # Simulation studio UI and local saved patterns
src/duel/          # Socket.IO 1v1 client
server.js          # Socket.IO rooms, reconnect/expiry lifecycle
```
