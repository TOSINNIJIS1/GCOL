import React from 'react';
import './App.scss';
import './rules/rules.scss';
import Game from './game/game';
import Rules from './rules/rules';
import Nav from './nav/nav';
import About from './about/about';
import Duel from './duel/duel';
import InfiniteWorld from './game/InfiniteWorld';
import { BrowserRouter as Router, Route } from 'react-router-dom';

function App() {
  const operations = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];
  return (
    <div className="container">
      <Router>
        <Nav />
        <Route exact path="/" render={() => <Game operations={operations} gridRow={20} gridCol={30} />} />
        <Route exact path="/play" render={() => <Game operations={operations} gridRow={20} gridCol={30} />} />
        <Route exact path="/duel" component={Duel} />
        <Route exact path="/infinite" component={InfiniteWorld} />
        <Route exact path="/rules" component={Rules} />
        <Route exact path="/about" component={About} />
      </Router>
    </div>
  );
}

export default App;
