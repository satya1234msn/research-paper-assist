import React from 'react';

export const ShinyBadge = ({ children, className = '', variant = 'primary' }) => {
  const variantStyles = {
    primary: 'border-blue-200 bg-blue-50 text-blue-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant] || variantStyles.primary} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current"></span>
      </span>
      {children}
    </span>
  );
};

export default ShinyBadge;
