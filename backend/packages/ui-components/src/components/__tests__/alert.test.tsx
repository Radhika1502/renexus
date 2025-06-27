import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../alert';

describe('Alert Component', () => {
  it('renders title and description when open', () => {
    render(
      <Alert
        open={true}
        onOpenChange={jest.fn()}
        title="Test Alert Title"
        description="Test Alert Description"
      />
    );
    expect(screen.getByText('Test Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Test Alert Description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Alert
        open={false}
        onOpenChange={jest.fn()}
        title="Test Alert Title"
        description="Test Alert Description"
      />
    );
    expect(screen.queryByText('Test Alert Title')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <Alert
        open={true}
        onOpenChange={jest.fn()}
        title="Confirm Action"
        onConfirm={handleConfirm}
        confirmLabel="Proceed"
      />
    );
    fireEvent.click(screen.getByText('Proceed'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = jest.fn();
    render(
      <Alert
        open={true}
        onOpenChange={jest.fn()}
        title="Cancel Action"
        onCancel={handleCancel}
        cancelLabel="Dismiss"
      />
    );
    fireEvent.click(screen.getByText('Dismiss'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange when overlay is clicked', () => {
    const handleOpenChange = jest.fn();
    render(
      <Alert
        open={true}
        onOpenChange={handleOpenChange}
        title="Test Alert"
      />
    );
    fireEvent.click(screen.getByRole('dialog').closest('.fixed') as HTMLElement); // Click on the overlay
    expect(handleOpenChange).toHaveBeenCalledTimes(1);
  });
});
