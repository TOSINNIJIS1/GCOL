import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import InfiniteWorld from './InfiniteWorld';

afterEach(() => vi.useRealTimers());

test('loads catalog patterns and frames distant cells', () => {
  const { getByText, container } = render(<InfiniteWorld initialCells={[[1000, 2000], [1001, 2001]]} />);
  expect(container.querySelectorAll('.infiniteViewport i.alive')).toHaveLength(0);
  fireEvent.click(getByText('Fit world'));
  expect(container.querySelectorAll('.infiniteViewport i.alive')).toHaveLength(2);
  fireEvent.click(getByText('Glider'));
  expect(container.querySelectorAll('.infiniteViewport i.alive')).toHaveLength(5);
  expect(container.querySelector('.worldReadout').textContent).toContain('Glider loaded');
});

test('speed control changes the simulation interval', () => {
  vi.useFakeTimers();
  const { getByText, getByLabelText, container } = render(<InfiniteWorld initialCells={[[0, -1], [0, 0], [0, 1]]} />);
  fireEvent.change(getByLabelText('Speed'), { target: { value: '800' } });
  fireEvent.click(getByText('Play'));
  act(() => { vi.advanceTimersByTime(799); });
  expect(container.querySelector('.worldReadout').textContent).toContain('G0 ·');
  act(() => { vi.advanceTimersByTime(1); });
  expect(container.querySelector('.worldReadout').textContent).toContain('G1 ·');
});

test('a still life pauses after one tick and remains stopped', () => {
  vi.useFakeTimers();
  const { getByText, container } = render(<InfiniteWorld initialCells={[[0, 0], [0, 1], [1, 0], [1, 1]]} />);
  fireEvent.click(getByText('Play'));
  act(() => { vi.advanceTimersByTime(250); });
  expect(container.querySelector('.worldReadout').textContent).toContain('Stable world detected · paused');
  act(() => { vi.advanceTimersByTime(1000); });
  expect(container.querySelector('.worldReadout').textContent).toContain('G1 ·');
});

test('a blinker pauses at its fifth occurrence of the initial state', () => {
  vi.useFakeTimers();
  const { getByText, container } = render(<InfiniteWorld initialCells={[[0, -1], [0, 0], [0, 1]]} />);
  fireEvent.click(getByText('Play'));
  for (let i = 0; i < 8; i += 1) act(() => { vi.advanceTimersByTime(250); });
  expect(container.querySelector('.worldReadout').textContent).toContain('Repeated state five times · paused');
  expect(container.querySelector('.worldReadout').textContent).toContain('G8 ·');
  act(() => { vi.advanceTimersByTime(1000); });
  expect(container.querySelector('.worldReadout').textContent).toContain('G8 ·');
});
