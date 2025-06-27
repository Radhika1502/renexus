import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Alert } from '../alert';
import { Progress } from '../progress';
import { Skeleton } from '../skeleton';
import { Tooltip } from '../tooltip';

expect.extend(toHaveNoViolations);

describe('Accessibility (axe)', () => {
  it('Alert component should have no a11y violations', async () => {
    const { container } = render(
      <Alert open title="Test Alert" description="Accessible alert" onConfirm={() => {}} onCancel={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Progress component should have no a11y violations', async () => {
    const { container } = render(<Progress value={50} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Skeleton component should have no a11y violations', async () => {
    const { container } = render(<Skeleton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Tooltip component should have no a11y violations', async () => {
    const { container } = render(
      <Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
