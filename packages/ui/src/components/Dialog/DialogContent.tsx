import React from 'react';
import { cn } from '../../utils/cn';
import { useDialog } from '../Dialog';

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-lg shadow-lg p-6 w-full max-w-md',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

DialogContent.displayName = 'DialogContent';

export default DialogContent; 