import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ 
  children, 
  className = '', 
  onClick,
  hover = true,
  padding = 'lg',
  variant = 'default'
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const variantClasses = {
    default: 'bg-white border border-[#e5e7eb] shadow-none',
    elevated: 'bg-white border border-[#e5e7eb] shadow-none',
    outlined: 'bg-white border border-[#e5e7eb] shadow-none'
  };

  return (
    <div
      className={`
        rounded-lg
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-150
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
