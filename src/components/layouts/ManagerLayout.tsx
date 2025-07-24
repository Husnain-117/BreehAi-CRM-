// src/components/layouts/ManagerLayout.tsx
import React, { useState, Fragment } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavLink from '../common/NavLink';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import NotificationBell from '../notifications/NotificationBell';

// Re-using Icons from AgentLayout or a shared Icon component file
const MenuIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

const ManagerLayout: React.FC = () => {
  const { logout, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const commonNavLinkClasses = 'flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-in-out';
  const activeNavLinkClasses = 'bg-primary/10 text-primary rounded-lg';
  const inactiveNavLinkClasses = 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg';

  // Manager-specific links (can be expanded)
  const managerNavLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/leads', label: 'All Leads' }, 
    { to: '/follow-ups', label: 'All Follow-Ups' },
    { to: '/meetings', label: 'All Meetings' },
    { to: '/todos', label: 'To-Do List' },
    { to: '/daily-report', label: 'Daily Reports' },
    { to: '/attendance', label: 'Attendance' },
    // Example manager-specific links (add actual routes and components later)
    // { to: '/manager/team-performance', label: 'Team Performance' },
    // { to: '/manager/agent-overview', label: 'Agent Overview' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Sidebar (Off-canvas) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="relative z-40 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <aside className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 w-full">
                  <div className="flex h-16 shrink-0 items-center mt-4">
                    <Link to="/dashboard" className="font-display text-2xl font-semibold text-primary">
                      Manager Hub
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {managerNavLinks.map(link => (
                            <li key={link.to}>
                              <NavLink to={link.to} className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>{link.label}</NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        {profile && (
                          <div className="mb-3 px-1 py-2 text-sm text-muted-foreground">
                            Welcome, <span className="font-medium text-foreground">{profile.full_name}</span>
                          </div>
                        )}
                        <button
                          onClick={logout}
                          className={`${commonNavLinkClasses} w-full bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg group`}
                        >
                          <LogoutIcon className="mr-2 group-hover:scale-105 transition-transform" />
                          Logout
                        </button>
                      </li>
                    </ul>
          </nav>
                </aside>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition.Root>

      {/* Static Sidebar for Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center mt-4">
            <Link to="/dashboard" className="font-display text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
              CRM Manager
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1.5">
                  {managerNavLinks.map(link => (
                    <li key={link.to}>
                      <NavLink to={link.to} className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>{link.label}</NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                {profile && (
                  <div className="mb-3 px-1 py-2 text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{profile.full_name}</span>
                  </div>
                )}
          <button 
            onClick={logout} 
                  className={`${commonNavLinkClasses} w-full bg-destructive/10 text-destructive hover:bg-destructive/20 group`}
          >
                  <LogoutIcon className="mr-2 h-5 w-5 transition-transform group-hover:scale-105" />
            Logout
          </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        {/* Sticky Header for Mobile, includes Hamburger Menu */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-6 border-b border-border bg-card px-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-foreground lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-foreground">
            Manager Hub
          </div>
          {/* Notification Bell */}
          <NotificationBell />
        </header>

        {/* Desktop header for notifications */}
        <header className="hidden lg:block sticky top-0 z-30 h-16 border-b border-border bg-card shadow-sm">
          <div className="flex h-full items-center justify-end px-6">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-background overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout; 