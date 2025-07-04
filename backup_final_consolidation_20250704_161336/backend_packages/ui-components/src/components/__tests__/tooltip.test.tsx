import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from '../tooltip';

describe('Tooltip Component', () => {
  it('does not show content by default', () => {
    render(
      <Tooltip content="Test Tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByText('Test Tooltip')).not.toBeInTheDocument();
  });

  it('shows content on hover', async () => {
    render(
      <Tooltip content="Test Tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    await waitFor(() => {
      expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    });
  });

  it('hides content on mouse leave', async () => {
    render(
      <Tooltip content="Test Tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    await waitFor(() => {
      expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    });
    fireEvent.mouseLeave(screen.getByText('Hover me'));
    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip')).not.toBeInTheDocument();
    });
  });

  it('respects controlled open state', async () => {
    const { rerender } = render(
      <Tooltip content="Controlled Tooltip" open={false}>
        <button>Trigger</button>
      </Tooltip>
    );
    expect(screen.queryByText('Controlled Tooltip')).not.toBeInTheDocument();

    rerender(
      <Tooltip content="Controlled Tooltip" open={true}>
        <button>Trigger</button>
      </Tooltip>
    );
    await waitFor(() => {
      expect(screen.getByText('Controlled Tooltip')).toBeInTheDocument();
    });
  });
});
