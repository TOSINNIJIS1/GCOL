import React from 'react';
import './App.css';
import Game from './game/game';
import Rules from './rules/rules';
import Nav from './nav/nav';
import Home from './nav/homepage/home';
import About from './about/about';
import { BrowserRouter as Router, Route } from 'react-router-dom'

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
      <Router>
      <Nav />
        <Route exact path="/" render={() => <Home /> } />
        <Route exact path="/play" render={() => <Game operations={operations} gridRow ={gridRow} gridCol = {gridCol} /> } />   
        <Route exact path="/rules" render={() => <Rules /> } />
        <Route exact path="/about" render={() => <About /> } />
      </Router>
      
    </div>
  );
}

export default App;
