import * as React from "react";
import clsx from "clsx";
import { Menu, X } from "lucide-react";

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  logo?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  position?: "left" | "right";
}

/**
 * Mobile-responsive sidebar navigation component.
 * Collapses on small screens and provides toggle button.
 *
 * @example
 * <Sidebar logo={<Logo />} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)}>
 *   <SidebarItem>Dashboard</SidebarItem>
 * </Sidebar>
 */
export const Sidebar: React.FC<SidebarProps> = ({
  children,
  className,
  logo,
  isOpen = true,
  onToggle,
  position = "left",
}) => {
  // For small screens, handle sidebar state internally if not provided
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const sidebarOpen = onToggle ? isOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="lg:hidden fixed z-20 top-4 bg-primary-600 text-white p-2 rounded-md shadow-md transition-all duration-200"
        style={{ [position]: "1rem" }}
        aria-expanded={sidebarOpen}
        aria-controls="sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile when sidebar is open */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 z-10 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
        onClick={handleToggle}
      />

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={clsx(
          "fixed top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-20 flex flex-col transition-transform duration-300 ease-in-out",
          position === "left" ? "left-0" : "right-0",
          !sidebarOpen && (position === "left" ? "-translate-x-full" : "translate-x-full"),
          "lg:translate-x-0 lg:static lg:z-0",
          className
        )}
      >
        {/* Logo area */}
        {logo && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {logo}
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {children}
        </nav>
      </aside>
    </>
  );
};

export interface SidebarItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Sidebar navigation item.
 */
export const SidebarItem: React.FC<SidebarItemProps> = ({
  children,
  icon,
  isActive = false,
  href,
  onClick,
  className,
}) => {
  const content = (
    <>
      {icon && <span className="mr-3">{icon}</span>}
      <span>{children}</span>
    </>
  );

  const itemClasses = clsx(
    "flex items-center px-4 py-2 rounded-md transition-colors",
    isActive
      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50",
    className
  );

  if (href) {
    return (
      <a href={href} className={itemClasses} aria-current={isActive ? "page" : undefined}>
        {content}
      </a>
    );
  }

  return (
    <button 
      type="button" 
      className={itemClasses} 
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </button>
  );
};
