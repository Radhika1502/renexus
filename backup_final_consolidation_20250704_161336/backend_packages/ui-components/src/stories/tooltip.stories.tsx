import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../components/tooltip';
import { Button } from '../components/button'; // Assuming you have a Button component

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'The content to be displayed inside the tooltip.',
    },
    children: {
      control: 'none',
      description: 'The element that triggers the tooltip on hover/focus.',
    },
    delayDuration: {
      control: 'number',
      description: 'The duration from when the mouse enters the trigger until the tooltip opens (in ms).',
    },
    open: {
      control: 'boolean',
      description: 'The controlled open state of the tooltip.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'The default open state when uncontrolled.',
    },
    onOpenChange: {
      action: 'open change',
      description: 'Event handler called when the open state changes.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a default tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const WithLongContent: Story = {
  args: {
    content: 'This tooltip has a much longer content to demonstrate how it handles more extensive text and wraps within its boundaries.',
    children: <Button>Hover for long content</Button>,
  },
};

export const CustomDelay: Story = {
  args: {
    content: 'This tooltip appears after a 1-second delay.',
    children: <Button>Hover for custom delay</Button>,
    delayDuration: 1000,
  },
};

export const ControlledTooltip: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <Tooltip {...args} open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(!open)}>Click to Toggle Tooltip</Button>
        </Tooltip>
        <p>Tooltip is {open ? 'Open' : 'Closed'}</p>
      </div>
    );
  },
  args: {
    content: 'This tooltip is controlled by a button click.',
  },
};
