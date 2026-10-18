import React from 'react';
import './click.scss';

export default function OnClickButton({ running, onToggle, onStep, onRandom, onClear, speed, onSpeedChange }) {
    return <div className="controls" aria-label="Simulation controls">
        <button className="primaryAction" type="button" onClick={onToggle}>{running ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={onStep} disabled={running}>Step</button>
        <button type="button" onClick={onRandom}>Randomize</button>
        <button type="button" onClick={onClear}>Clear</button>
        <label className="speedControl" htmlFor="speed">Speed<select id="speed" value={speed} onChange={(event) => onSpeedChange(Number(event.target.value))}><option value="1000">Slow</option><option value="500">Normal</option><option value="200">Fast</option></select></label>
    </div>;
}
