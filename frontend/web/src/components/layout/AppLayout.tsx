import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated && (
        <>
          <Navbar>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              {/* Other navbar items like user profile, settings, etc. */}
            </div>
          </Navbar>
          <Sidebar />
        </>
      )}
      
      <main className={`${isAuthenticated ? 'pt-16 pl-64' : ''} transition-all duration-300 ease-in-out`}>
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
