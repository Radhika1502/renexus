import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component to test
const SimpleTaskBoard = ({ title = 'Task Board' }) => {
  return (
    <div>
      <h1>{title}</h1>
      <div data-testid="column-backlog">Backlog Column</div>
      <div data-testid="column-todo">Todo Column</div>
      <div data-testid="column-inProgress">In Progress Column</div>
    </div>
  );
};

describe('Simple Task Board Test', () => {
  it('renders the title correctly', () => {
    render(<SimpleTaskBoard />);
    expect(screen.getByText('Task Board')).toBeInTheDocument();
  });

  it('renders all columns', () => {
    render(<SimpleTaskBoard />);
    expect(screen.getByTestId('column-backlog')).toBeInTheDocument();
    expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    expect(screen.getByTestId('column-inProgress')).toBeInTheDocument();
  });
});
