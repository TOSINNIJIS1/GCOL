import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders the simulation workspace', () => {
    const { getByText } = render(<App />);
    expect(getByText('VOAI')).toBeInTheDocument();
    expect(getByText('Pattern library')).toBeInTheDocument();
    expect(getByText('Simulation', { selector: 'a' })).toBeInTheDocument();
    expect(getByText('1v1 Duel', { selector: 'a' })).toBeInTheDocument();
});
