import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  // New prop for icon color variant if needed, e.g., based on stat type
  // iconVariant?: 'primary' | 'secondary' | 'accent'; 
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, className }) => {
  // const iconBgColor = iconVariant === 'secondary' ? 'bg-secondary' : iconVariant === 'accent' ? 'bg-accent' : 'bg-primary';
  // const iconTextColor = iconVariant === 'secondary' ? 'text-secondary-foreground' : iconVariant === 'accent' ? 'text-accent-foreground' : 'text-primary-foreground';

  return (
    <div 
      className={`bg-card shadow-md rounded-lg p-5 border border-border hover:shadow-lg transition-all duration-300 ease-in-out group ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase truncate tracking-wider">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div 
          className={`ml-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110`}
        >
          {icon} 
        </div>
      </div>
      {description && (
        <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default StatCard; 