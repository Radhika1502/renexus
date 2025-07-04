import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../switch';

describe('Switch Component', () => {
  it('renders correctly with label', () => {
    render(<Switch label="Test Switch" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Test Switch')).toBeInTheDocument();
  });

  it('handles checked state correctly', () => {
    const handleChange = jest.fn();
    render(<Switch checked={false} onCheckedChange={handleChange} />);
    
    const switchButton = screen.getByRole('button');
    expect(switchButton).toHaveAttribute('data-state', 'unchecked');
    
    fireEvent.click(switchButton);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('respects disabled state', () => {
    render(<Switch disabled label="Disabled Switch" />);
    
    const switchButton = screen.getByRole('button');
    expect(switchButton).toBeDisabled();
  });
});
