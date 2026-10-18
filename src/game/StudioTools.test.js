import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CATALOG, PatternExplorer, PatternPreview } from './StudioTools';
import { cellsToWorld, stepWorld } from './infinite';

test('catalog oscillators return after their advertised periods', () => {
  for (const [name, period] of [['toad', 2], ['pentadecathlon', 15], ['tub', 1]]) {
    const initial = cellsToWorld(CATALOG[name].cells);
    let world = initial;
    for (let tick = 1; tick <= period; tick += 1) {
      world = stepWorld(world);
      if (tick < period) expect(world).not.toEqual(initial);
    }
    expect(world).toEqual(initial);
  }
});

test('lightweight spaceship moves two cells after four generations', () => {
  const initial = cellsToWorld(CATALOG.lightweight.cells);
  let world = initial;
  for (let tick = 0; tick < 4; tick += 1) world = stepWorld(world);
  expect(world).toEqual(new Set([...initial].map((id) => {
    const [x, y] = id.split(',').map(Number);
    return `${x - 2},${y}`;
  })));
});

test('preview includes every cell in a pattern larger than five columns', () => {
  const { container } = render(<PatternPreview cells={CATALOG.pentadecathlon.cells} />);
  expect(container.querySelectorAll('rect').length).toBe(12);
  expect(container.querySelector('svg').getAttribute('viewBox')).toBe('-1 -1 12 5');
});

test('invalid stored favorites do not crash search and placement', () => {
  localStorage.setItem('voai-cgol.pattern-favorites.v1', '{}');
  const load = vi.fn();
  const { getByLabelText, getByText } = render(<PatternExplorer patterns={{}} onLoad={load} />);
  fireEvent.change(getByLabelText('Search patterns'), { target: { value: '  toad  ' } });
  fireEvent.click(getByText('Toad'));
  expect(load).toHaveBeenCalledWith('Toad', CATALOG.toad.cells);
  localStorage.clear();
});
