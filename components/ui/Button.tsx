import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  customColor?: string; // For merchant branding overrides
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading, 
  customColor,
  style,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = customColor 
        ? `text-white hover:brightness-110 shadow-sm` 
        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm";
      break;
    case 'secondary':
      variantStyles = "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50";
      break;
    case 'danger':
      variantStyles = "bg-red-50 text-red-600 hover:bg-red-100";
      break;
    case 'ghost':
      variantStyles = "text-gray-600 hover:bg-gray-100";
      break;
  }

  const combinedStyle = customColor && variant === 'primary' 
    ? { ...style, backgroundColor: customColor } 
    : style;

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`}
      disabled={isLoading || props.disabled}
      style={combinedStyle}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};