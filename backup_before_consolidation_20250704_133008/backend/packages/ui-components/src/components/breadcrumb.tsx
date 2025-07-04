import * as React from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component.
 *
 * @example
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Projects', href: '/projects' },
 *   { label: 'Project Name' }
 * ]} />
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={clsx("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" aria-hidden="true" />
              )}
              
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {item.label}
                </a>
              ) : (
                <span className={clsx(
                  "text-sm font-medium",
                  isLast ? "text-gray-900" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
Breadcrumb.displayName = "Breadcrumb";
