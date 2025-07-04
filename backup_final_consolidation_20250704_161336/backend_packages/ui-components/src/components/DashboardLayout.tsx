import * as React from "react";

/**
 * DashboardLayout provides a dashboard-specific structure with sidebar and topbar.
 * Extend or customize as needed for your application.
 */
export const DashboardLayout: React.FC<{
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}> = ({ sidebar, topbar, children }) => (
  <div className="min-h-screen flex flex-col bg-gray-100">
    <nav className="h-14 bg-white shadow flex items-center px-4">{topbar}</nav>
    <div className="flex flex-1">
      <aside className="w-60 bg-white border-r border-gray-200 p-4 hidden md:block">{sidebar}</aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  </div>
);
