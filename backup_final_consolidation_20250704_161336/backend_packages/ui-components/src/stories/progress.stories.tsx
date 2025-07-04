import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '../components/progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
      },
      description: 'The current value of the progress bar.',
    },
    max: {
      control: 'number',
      description: 'The maximum value of the progress bar.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const FullProgress: Story = {
  args: {
    value: 100,
  },
};

export const EmptyProgress: Story = {
  args: {
    value: 0,
  },
};

export const CustomMax: Story = {
  args: {
    value: 75,
    max: 150,
  },
};

export const AnimatedProgress: Story = {
  render: (args) => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 500);

      return () => clearInterval(timer);
    }, []);

    return <Progress {...args} value={progress} />;
  },
  args: {
    value: 0,
  },
};
