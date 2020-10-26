import React from 'react';
import './App.css';
import Game from './game/game'
import Home from './homepage/home';

function App() {
  // Direction for the grid
  const operations = [
        [0, 1],
        [0, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, 0],
        [-1, 0]
    ]

  const gridRow = 35;
  const gridCol = 35;
 
  return (
    <div className="container">
      <Home />
      <Game operations={operations} gridRow ={gridRow} gridCol = {gridCol} />
    </div>
  );
}

export default App;
