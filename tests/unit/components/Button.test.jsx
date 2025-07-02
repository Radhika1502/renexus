/**
 * Unit Tests for Button Component
 * Phase 5.1.1 - Unit Testing
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../src/components/ui/Button';

describe('Button Component', () => {
  // Test rendering with default props
  test('renders button with default props', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('btn');
    expect(button).not.toHaveClass('btn-primary');
  });

  // Test rendering with variant props
  test('renders button with primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-primary');
  });

  // Test disabled state
  test('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  // Test click handler
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    const button = screen.getByText('Clickable Button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test different sizes
  test('renders buttons with different sizes', () => {
    const { rerender } = render(<Button size="small">Small Button</Button>);
    let button = screen.getByText('Small Button');
    expect(button).toHaveClass('btn-sm');

    rerender(<Button size="large">Large Button</Button>);
    button = screen.getByText('Large Button');
    expect(button).toHaveClass('btn-lg');
  });

  // Test loading state
  test('renders button in loading state', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByText('Loading Button');
    expect(button).toHaveClass('btn-loading');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // Test with icon
  test('renders button with icon', () => {
    render(
      <Button icon="plus">
        Add Item
      </Button>
    );
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('button-icon')).toBeInTheDocument();
  });

  // Test with custom class
  test('applies custom class name', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByText('Custom Button');
    expect(button).toHaveClass('custom-class');
  });
});
