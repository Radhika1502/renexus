import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress Component', () => {
  it('renders correctly with default value', () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders with custom max value', () => {
    render(<Progress value={75} max={150} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemax', '150');
  });

  it('applies correct width style based on value and max', () => {
    render(<Progress value={25} max={100} />);
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.querySelector('.absolute'); // Select the indicator div
    expect(indicator).toHaveStyle('width: 25%');

    render(<Progress value={50} max={200} />);
    const progressBar2 = screen.getByRole('progressbar');
    const indicator2 = progressBar2.querySelector('.absolute');
    expect(indicator2).toHaveStyle('width: 25%'); // 50/200 = 25%
  });

  it('handles value exceeding max', () => {
    render(<Progress value={120} max={100} />);
    const progressBar = screen.getByRole('progressbar');
    const indicator = progressBar.querySelector('.absolute');
    expect(progressBar).toHaveAttribute('aria-valuenow', '120');
    expect(indicator).toHaveStyle('width: 120%'); // Should still calculate based on value/max
  });
});
