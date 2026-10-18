import React from 'react';
import './rules.scss';

const rules = [
    ['01', 'Birth', 'A dead cell becomes alive when it has exactly three living neighbours.'],
    ['02', 'Survival', 'A living cell survives when it has two or three living neighbours.'],
    ['03', 'Underpopulation', 'A living cell with fewer than two neighbours dies.'],
    ['04', 'Overpopulation', 'A living cell with more than three neighbours dies.'],
];

export default function Rules() {
    return <main className="rulesPage">
        <div className="rulesIntro"><p className="sectionLabel">THE LOGIC / 01</p><h1>Simple rules.<br /><em>Endless worlds.</em></h1><p>Conway's Game of Life is a cellular automaton: a universe made of cells that changes one generation at a time, with no players and no randomness required.</p></div>
        <section className="rulesGrid" aria-label="Game of Life rules">{rules.map(([number, title, description]) => <article className="ruleCard" key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}</section>
        <section className="stopPanel"><div><p className="sectionLabel">THE SIMULATOR / 02</p><h2>When does it stop?</h2></div><div className="stopCopy"><p>VOAI-CGOL pauses automatically when it recognizes that the world is no longer producing meaningful change.</p><ul><li><b>Stable board</b><span>The next generation is identical to the current one.</span></li><li><b>Repeated state</b><span>The same complete board appears five times.</span></li></ul></div></section>
        <p className="rulesFooter">Tip: Start with a Glider to see motion, a Blinker to see oscillation, or a Block to see a stable pattern.</p>
    </main>;
}
