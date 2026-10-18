import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Game from './game';

const operations = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];

test('supports painting and undoing a board edit', () => {
    const { getByLabelText, getByRole } = render(<Game gridRow={4} gridCol={4} operations={operations} />);
    const firstCell = getByLabelText('Row 1, column 1, dead');

    fireEvent.mouseDown(firstCell);

    expect(getByLabelText('Row 1, column 1, alive')).toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: /undo/i }));
    expect(getByLabelText('Row 1, column 1, dead')).toBeInTheDocument();
});

test('loads a pattern into the canvas', () => {
    const { getByText, getAllByRole } = render(<Game gridRow={20} gridCol={30} operations={operations} />);

    fireEvent.click(getByText('Block'));

    expect(getAllByRole('gridcell').filter((cell) => cell.getAttribute('aria-label').includes('alive')).length).toBe(4);
});
