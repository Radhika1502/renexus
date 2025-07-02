
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component to test
const TaskCard = ({ task }) => {
  return (
    <div data-testid="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div>Status: {task.status}</div>
      <div>Priority: {task.priority}</div>
    </div>
  );
};

describe('TaskCard Component', () => {
  it('renders task details correctly', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'This is a test task',
      status: 'todo',
      priority: 'medium'
    };
    
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
    expect(screen.getByText('Status: todo')).toBeInTheDocument();
    expect(screen.getByText('Priority: medium')).toBeInTheDocument();
  });
});
