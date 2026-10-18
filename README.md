# VOAI-CGOL

VOAI-CGOL is an interactive, browser-based Conway's Game of Life laboratory. Draw a world cell by cell, load a classic pattern, or randomize the board and watch simple rules create complex motion.

## Features

- Interactive 30 × 20 simulation canvas
- Play, pause, and single-generation stepping
- Speed modes: slow, balanced, and fast
- Randomize and clear controls
- Classic patterns: Glider, Beacon, Pulsar, Blinker, and Block
- Generation and living-cell counters
- Automatic stopping for stable boards
- Automatic stopping when a previous board state appears five times
- Spacebar shortcut for play/pause
- Responsive dark interface for desktop and mobile
- Online 1v1 Survival Duel with private room codes
- Live synchronized setup board, 20-second opening phase, and 30-generation matches

## Getting started

Requirements:

- Node.js 18 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. If that port is already in use, Create React App will offer another port.

## Play online 1v1

Run the client and the realtime server in separate terminals:

```bash
# Terminal 1: realtime room server
npm run server

# Terminal 2: React client
npm start
```

Open the **1v1 Duel** tab. One player creates a room and shares the five-character code; the other player enters that code to join.

Both players receive a color and have 20 seconds to build an opening. The board then evolves for 30 generations. The player whose color owns the most living cells wins.

For deployment, serve the production build and Socket.IO server together:

```bash
npm run serve
```

When the browser client and server use different origins, set `REACT_APP_SOCKET_URL` to the public server URL before building the client.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the development server with hot reload. |
| `npm run server` | Starts the Socket.IO realtime room server on port 3001. |
| `npm run serve` | Builds the client and serves it through the multiplayer server. |
| `npm test -- --watchAll=false` | Runs the automated test suite once. |
| `npm run build` | Creates an optimized production build. |

The project includes a compatibility flag for the legacy webpack version used by Create React App, so it works with current Node/OpenSSL versions.

## How the rules work

Each cell has up to eight neighbors. Every generation is calculated from the previous board, so all cells update simultaneously:

1. A dead cell with exactly three live neighbors becomes alive.
2. A live cell with fewer than two neighbors dies from underpopulation.
3. A live cell with two or three neighbors survives.
4. A live cell with more than three neighbors dies from overpopulation.

## Automatic stopping

The simulation pauses when either condition is met:

- **Stable board:** the next generation is identical to the current generation.
- **Repeated state:** the same complete board state has appeared five times.

Editing the board, loading a pattern, randomizing, or clearing resets the repeat tracking.

## Project structure

```text
src/
├── game/       Simulation state, board, patterns, and workspace styles
├── nav/        Application navigation
├── rules/      Rules page and explanation
├── about/      About page
└── App.js      Routes and application composition
```

## License

This project is private and intended for personal development and experimentation.
