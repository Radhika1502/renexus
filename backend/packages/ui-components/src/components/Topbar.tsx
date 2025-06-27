import * as React from "react";

/**
 * Topbar navigation component. Pass navigation items as children.
 */
export const Topbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-4 h-full">{children}</div>
);
