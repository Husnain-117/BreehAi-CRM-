// src/components/layouts/SuperAdminLayout.tsx
import React, { useState, Fragment } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavLink from '../common/NavLink';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import NotificationBell from '../notifications/NotificationBell';

// Re-using Icons (consider a shared file for these)
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

// Example icons for admin links (replace with actual icons)
const UsersIcon = ({ className = 'w-5 h-5 mr-3' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);
const SettingsIcon = ({ className = 'w-5 h-5 mr-3' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 1.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SuperAdminLayout: React.FC = () => {
  const { logout, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const commonNavLinkClasses = 'flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out';
  const activeNavLinkClasses = 'bg-primary/10 text-primary rounded-lg font-semibold';
  const inactiveNavLinkClasses = 'text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg';

  // Super Admin Navigation Links
  const superAdminNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: null }, // Add generic dashboard icon if desired
    { to: '/leads', label: 'Leads Overview', icon: null }, // Add generic leads icon
    { to: '/admin/users', label: 'User Management', icon: UsersIcon },
    { to: '/admin/settings', label: 'System Settings', icon: SettingsIcon },
    { to: '/admin/team-progress', label: 'Team Progress', icon: UsersIcon },
    { to: '/daily-report', label: 'Daily Reports', icon: null }, // Placeholder icon
    { to: '/attendance', label: 'Attendance', icon: null }, // Added Attendance link
    // Add other general links like Follow-ups, Meetings if super admin needs them at top level
    { to: '/follow-ups', label: 'All Follow-Ups', icon: null },
    { to: '/meetings', label: 'All Meetings', icon: null },
    { to: '/todos', label: 'To-Do List', icon: null },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="relative z-40 lg:hidden">
          {/* ... (Transition.Child for overlay, same as Agent/ManagerLayout) ... */}
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
                      Admin Panel
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {superAdminNavLinks.map(link => (
                            <li key={link.to}>
                              <NavLink to={link.to} className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                                {link.icon && <link.icon />}
                                {link.label}
                              </NavLink>
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
              CRM Admin
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1.5">
                  {superAdminNavLinks.map(link => (
                    <li key={link.to}>
                      <NavLink to={link.to} className={commonNavLinkClasses} activeClassName={activeNavLinkClasses} inactiveClassName={inactiveNavLinkClasses}>
                        {link.icon && <link.icon />}
                        {link.label}
                      </NavLink>
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-6 border-b border-border bg-card px-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-foreground lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-foreground">
            Admin Panel
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

export default SuperAdminLayout; 