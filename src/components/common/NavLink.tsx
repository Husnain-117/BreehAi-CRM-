import React from 'react';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ 
  to, 
  children, 
  className = "",
  activeClassName = "font-bold text-blue-600", // Example active style
  inactiveClassName = "text-gray-700 hover:text-blue-500" // Example inactive style
}) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <Link
      to={to}
      className={`${className} ${match ? activeClassName : inactiveClassName} p-2 rounded-md transition-colors`}
    >
      {children}
    </Link>
  );
};

export default NavLink; 