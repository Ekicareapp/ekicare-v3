import { ReactNode } from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  label,
  error,
  helperText,
  icon,
}: InputProps) {
  const baseClasses = 'w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]';
  
  const errorClasses = error ? 'border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]' : '';

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#111827]">
          {label}
          {required && <span className="text-[#ef4444] ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[#6b7280]">{icon}</span>
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseClasses} ${errorClasses} ${icon ? 'pl-10' : ''} ${className}`}
        />
      </div>
      
      {error && (
        <p className="text-sm text-[#ef4444]">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-[#6b7280]">{helperText}</p>
      )}
    </div>
  );
}
