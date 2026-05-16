import React from 'react';

export default function GradientButton({ children, onClick, className = '', disabled = false, size = 'default' }) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    default: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl 
        transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100
        ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}