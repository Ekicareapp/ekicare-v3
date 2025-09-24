import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  icon,
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-150 focus:outline-none inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-[#f86f4d] text-white disabled:bg-gray-300 disabled:cursor-not-allowed border border-[#f86f4d] hover:bg-[#e65d3f]',
    secondary: 'bg-white text-[#111827] disabled:bg-gray-100 disabled:cursor-not-allowed border border-[#e5e7eb] hover:bg-[#f9fafb]',
    ghost: 'bg-transparent text-[#6b7280] disabled:bg-transparent disabled:cursor-not-allowed border border-transparent hover:text-[#111827] hover:bg-[#f86f4d10]',
    danger: 'bg-[#ef4444] text-white disabled:bg-gray-300 disabled:cursor-not-allowed border border-[#ef4444] hover:bg-red-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
