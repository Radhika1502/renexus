import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../components/alert';
import { Button } from '../components/button'; // Assuming you have a Button component

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls the open state of the alert dialog.',
    },
    onOpenChange: {
      action: 'open change',
      description: 'Event handler called when the open state changes.',
    },
    title: {
      control: 'text',
      description: 'The title of the alert dialog.',
    },
    description: {
      control: 'text',
      description: 'The descriptive text of the alert dialog.',
    },
    confirmLabel: {
      control: 'text',
      description: 'Text for the confirm button.',
    },
    cancelLabel: {
      control: 'text',
      description: 'Text for the cancel button.',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback function when the confirm button is clicked.',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback function when the cancel button is clicked.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Alert</Button>
        <Alert {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  args: {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },
};

export const DestructiveAlert: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Delete Item</Button>
        <Alert {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  args: {
    title: 'Delete Item',
    description: 'This will permanently delete the item. Are you sure you want to proceed?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: () => alert('Item deleted!'),
  },
};

export const InfoAlert: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Info</Button>
        <Alert {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  args: {
    title: 'Information',
    description: 'This is an informational message.',
    confirmLabel: 'Got it',
    cancelLabel: undefined, // No cancel button
  },
};
