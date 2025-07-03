import React from 'react';
import { cn } from '../../utils/cn';
import { useTabs } from '../Tabs';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const { value: currentValue, onValueChange } = useTabs();
    const isActive = currentValue === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onValueChange(value);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive && 'bg-white text-gray-950 shadow-sm',
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

export default TabsTrigger; 