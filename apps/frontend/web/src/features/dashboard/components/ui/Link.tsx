import React from 'react';

interface LinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ to, className = '', children }) => {
  return (
    <a 
      href={to} 
      className={className}
      onClick={(e) => {
        e.preventDefault();
        // In a real app, this would use a router navigation
        console.log(`Navigating to: ${to}`);
      }}
    >
      {children}
    </a>
  );
};
