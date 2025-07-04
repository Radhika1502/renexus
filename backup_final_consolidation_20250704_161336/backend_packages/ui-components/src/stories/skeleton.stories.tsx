import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../components/skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'text',
      description: 'The width of the skeleton. Can be a string (e.g., "100%") or a number (e.g., 100).',
    },
    height: {
      control: 'text',
      description: 'The height of the skeleton. Can be a string (e.g., "20px") or a number (e.g., 20).',
    },
    radius: {
      control: 'text',
      description: 'The border-radius of the skeleton. Can be a string (e.g., "8px") or a number (e.g., 4).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

export const Circle: Story = {
  args: {
    width: 50,
    height: 50,
    radius: '50%',
  },
};

export const TextLine: Story = {
  args: {
    width: '100%',
    height: 16,
  },
};

export const CardLayout: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2 p-4 border rounded-md w-64">
      <Skeleton width="80%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="90%" height={16} />
      <Skeleton width="70%" height={16} />
    </div>
  ),
  args: {},
};

export const ImagePlaceholder: Story = {
  args: {
    width: 200,
    height: 150,
    radius: 8,
  },
};
