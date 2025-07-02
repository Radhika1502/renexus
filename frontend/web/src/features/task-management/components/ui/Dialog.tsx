import React, { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, onOpenChange, children }) => {
  if (!open) return null;
  
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <h2 className="text-xl font-semibold">{children}</h2>;
};

export const DialogContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="py-4">{children}</div>;
};

export const DialogFooter: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="flex justify-end space-x-2 pt-4 border-t">{children}</div>;
};

export const Button: React.FC<{
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}> = ({ onClick, type = 'button', variant = 'primary', size = 'md', disabled, loading, className, children }) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100"
  };
  
  const baseClasses = "rounded font-medium focus:outline-none";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
