import React, { useEffect, useState } from 'react';
import { exportRecording, importRecording, MAX_RECORDING_BYTES } from './recording';

export default function Timeline({ mode, snapshots, cursor, onScrub, onLimit, onImport, onBranch }) {
  const [limit, setLimit] = useState(120);
  const [message, setMessage] = useState('');
  const [replaying, setReplaying] = useState(false);
  const last = snapshots.length - 1;
  const current = snapshots[cursor];
  const scrub = (index) => { setReplaying(false); onScrub(index); };
  useEffect(() => {
    if (!replaying) return undefined;
    if (cursor >= last) { setReplaying(false); return undefined; }
    const timer = window.setTimeout(() => onScrub(cursor + 1), 200);
    return () => window.clearTimeout(timer);
  }, [replaying, cursor, last, onScrub]);
  const exportJson = () => {
    try {
      const text = exportRecording(mode, snapshots);
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'voai-cgol-recording.json'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Recording downloaded.');
    } catch (error) { setMessage(error.message); }
  };
  const importJson = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setReplaying(false);
    if (file.size > MAX_RECORDING_BYTES) { setMessage('Recording exceeds the 2 MB limit.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setMessage('Could not read the recording file.');
    reader.onload = () => {
      try { onImport(importRecording(reader.result, mode)); setMessage('Recording imported.'); }
      catch (error) { setMessage(error.message); }
    };
    reader.readAsText(file);
  };
  const peak = Math.max(1, ...snapshots.map((item) => item.analytics.population));
  const points = snapshots.map((item, index) => `${index / Math.max(1, last) * 100},${36 - item.analytics.population / peak * 32}`).join(' ');
  return <section className="timeline" aria-label="Evolution timeline">
    <div><span className="panelKicker">EVOLUTION TIMELINE</span><b>Generation {current?.generation || 0}</b>
      <small>Population {current?.analytics.population || 0} · +{current?.analytics.births || 0} births / {current?.analytics.deaths || 0} deaths</small></div>
    <svg className="populationChart" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={`Population trend across ${snapshots.length} snapshots. Peak population ${peak}.`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1={cursor / Math.max(1, last) * 100} x2={cursor / Math.max(1, last) * 100} y1="0" y2="40" stroke="currentColor" strokeWidth=".3" opacity=".5" />
    </svg>
    <input aria-label="Timeline generation" type="range" min="0" max={Math.max(0, last)} value={cursor} onChange={(event) => scrub(Number(event.target.value))} />
    <div className="timelineActions">
      <button type="button" aria-label="First recorded generation" disabled={cursor === 0} onClick={() => scrub(0)}>|‹</button>
      <button type="button" aria-label="Previous recorded generation" disabled={cursor === 0} onClick={() => scrub(cursor - 1)}>‹</button>
      <button type="button" disabled={last < 1} onClick={() => { if (!replaying) onScrub(cursor >= last ? 0 : cursor); setReplaying(!replaying); }}>{replaying ? 'Pause replay' : 'Play replay'}</button>
      <button type="button" aria-label="Next recorded generation" disabled={cursor >= last} onClick={() => scrub(cursor + 1)}>›</button>
      <button type="button" aria-label="Last recorded generation" disabled={cursor >= last} onClick={() => scrub(last)}>›|</button>
      <button type="button" onClick={() => { setReplaying(false); onBranch(); setMessage('Continued from this generation. Export a recording before branching to keep a separate copy.'); }}>Branch here</button>
      <button type="button" onClick={exportJson}>Export JSON</button>
      <label>Import JSON<input type="file" accept="application/json" onChange={importJson} /></label>
      <label>Limit<select value={limit} onChange={(event) => { const value = Number(event.target.value); setLimit(value); onLimit(value); }}>
        {[60, 120, 300, 500].map((value) => <option key={value} value={value}>{value}</option>)}
      </select></label>
    </div><small role="status">{message || `${snapshots.length} snapshots retained`}</small>
  </section>;
}
