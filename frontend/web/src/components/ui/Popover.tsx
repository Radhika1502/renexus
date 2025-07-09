import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, onClick }) => {
  return (
    <div onClick={onClick} className="inline-block">
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 ${className}`}>
      {children}
    </div>
  );
};

export const Popover: React.FC<PopoverProps> = ({ children, isOpen, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-2"
      style={{ minWidth: '200px' }}
    >
      {children}
    </div>
  );
}; 