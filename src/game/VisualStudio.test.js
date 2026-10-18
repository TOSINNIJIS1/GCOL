import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import VisualStudio from './VisualStudio';

test('creates a bounded finite-world share URL', () => {
  const clipboard = { writeText: () => Promise.resolve() };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  const { getByRole } = render(<VisualStudio board={[[1, 0], [0, 0]]} />);
  fireEvent.click(getByRole('button', { name: 'Share world' }));
  expect(window.location.hash).toMatch(/^#world=/);
});

test('rejects malformed shared-world state', () => {
  window.history.replaceState(null, '', '#world=not-valid');
  const { getByRole } = render(<VisualStudio board={[[0]]} onLoad={() => {}} />);
  expect(getByRole('status')).toHaveTextContent('invalid, unsupported, or too large');
});
