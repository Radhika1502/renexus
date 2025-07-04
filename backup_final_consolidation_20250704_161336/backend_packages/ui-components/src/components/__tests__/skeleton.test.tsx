import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton Component', () => {
  it('renders with default width and height', () => {
    render(<Skeleton />);
    const skeletonElement = screen.getByRole('generic'); // Skeleton renders a div, generic role is appropriate
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveStyle('width: 100%');
    expect(skeletonElement).toHaveStyle('height: 20px');
    expect(skeletonElement).toHaveStyle('border-radius: 4px');
  });

  it('renders with custom width and height', () => {
    render(<Skeleton width={300} height={50} />);
    const skeletonElement = screen.getByRole('generic');
    expect(skeletonElement).toHaveStyle('width: 300px');
    expect(skeletonElement).toHaveStyle('height: 50px');
  });

  it('renders with custom radius', () => {
    render(<Skeleton radius="50%" />);
    const skeletonElement = screen.getByRole('generic');
    expect(skeletonElement).toHaveStyle('border-radius: 50%');
  });

  it('applies additional class names', () => {
    render(<Skeleton className="custom-class" />);
    const skeletonElement = screen.getByRole('generic');
    expect(skeletonElement).toHaveClass('custom-class');
  });
});
