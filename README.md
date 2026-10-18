# VOAI-CGOL - Conway's Game of Life Studio

VOAI-CGOL is a browser-based Conway's Game of Life studio. It keeps the original dark, tactile simulator design while adding a reliable B3/S23 engine, RLE sharing, local pattern storage, interaction improvements, and an online 1v1 survival duel.

## Studio features

- Accurate Conway B3/S23 evolution with fixed edges or optional edge wrapping.
- Play, pause, single-step, clear, randomize, undo, redo, speed controls, population count, and generation history.
- Automatic pausing for a stable world or once the same board state has occurred five times.
- Centered presets: Glider, Beacon, Pulsar, Blinker, and Block work on any board dimensions.
- Draw using a mouse, touch, or keyboard. `Space` plays/pauses, `S` steps, and `R` resets; arrow keys move focus across the board and `Enter`/`Space` edits a focused cell.
- Standard RLE import/export with B3/S23 validation, a 200 × 200 pattern bound, and a 10,000-cell limit.
- Save up to 24 custom RLE patterns in the browser’s local storage.
- Private online 1v1 duels with room codes, synchronized boards, reconnect grace time, room expiry, and connection feedback.

## Development

Requirements: Node.js 18+ and npm.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The included OpenSSL compatibility flag lets this legacy Create React App version run on newer Node versions.

### Online multiplayer

Run the client and realtime service in separate terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm start
```

The client connects to `http://localhost:3001` in development. For a separate public server, set `REACT_APP_SOCKET_URL` before starting/building the client. During a duel, an active match pauses if either player disconnects and resumes automatically when both reconnect within 30 seconds. Inactive one-player rooms expire after 10 minutes.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the React development server. |
| `npm run server` | Start the Socket.IO duel server on port 3001. |
| `npm run serve` | Build the client and serve it with the Socket.IO server. |
| `npm test -- --watchAll=false --no-cache` | Run all tests once. |
| `npm run build` | Produce an optimized production build. |

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

The automated suite covers UI painting/undo and presets, plus pure simulation tests for still lifes, oscillators, gliders, fixed boundaries, edge wrapping, centering, and RLE validation/round-tripping.

## Project map

```text
src/game/life.js   # B3/S23 engine, board helpers, centered placement
src/game/rle.js    # RLE import/export and validation
src/game/game.js   # Simulation studio UI and local saved patterns
src/duel/          # Socket.IO 1v1 client
server.js          # Socket.IO rooms, reconnect/expiry lifecycle
```
