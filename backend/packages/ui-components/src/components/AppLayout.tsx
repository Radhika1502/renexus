import * as React from "react";

/**
 * AppLayout provides a basic page structure with header, sidebar, and main content area.
 * Extend or customize as needed for your application.
 */
export const AppLayout: React.FC<{
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}> = ({ sidebar, header, children }) => (
  <div className="min-h-screen flex flex-col">
    {header && <header className="h-16 bg-white shadow flex items-center px-4">{header}</header>}
    <div className="flex flex-1">
      {sidebar && <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 hidden md:block">{sidebar}</aside>}
      <main className="flex-1 p-4">{children}</main>
    </div>
  </div>
);
