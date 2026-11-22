import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from './ToastContainer';
import { onForbiddenAccess } from '../api/httpClient';
import { useToast } from '../context/ToastContext';

export interface MainLayoutProps {
  userName: string;
  userRole: string;
  userInitials: string;
  isAdmin: boolean;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  userName,
  userRole,
  userInitials,
  isAdmin,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const toast = useToast();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return onForbiddenAccess((message) => {
      toast.error(message);
    });
  }, [toast]);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] antialiased font-sans">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isMobile={isMobile}
        isAdmin={isAdmin}
        onLogout={onLogout}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full min-w-0 ${
          isMobile ? 'ml-0' : collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
