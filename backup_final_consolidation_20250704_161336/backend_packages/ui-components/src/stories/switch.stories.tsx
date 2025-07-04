import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../components/switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The controlled checked state of the switch',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state when uncontrolled',
    },
    onCheckedChange: {
      action: 'checked changed',
      description: 'Event handler called when the checked state changes',
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the user from interacting with the switch',
    },
    label: {
      control: 'text',
      description: 'The label for the switch',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// Basic switch example
export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

// Checked switch
export const Checked: Story = {
  args: {
    label: 'Enabled feature',
    defaultChecked: true,
  },
};

// Disabled switch
export const Disabled: Story = {
  args: {
    label: 'Disabled option',
    disabled: true,
  },
};

// Controlled switch with state
export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <Switch 
          {...args} 
          checked={checked} 
          onCheckedChange={setChecked}
        />
        <p className="text-sm">Current state: {checked ? 'On' : 'Off'}</p>
      </div>
    );
  },
  args: {
    label: 'Controlled switch',
  },
};
