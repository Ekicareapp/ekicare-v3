import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#111827] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-[#9ca3af]">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
              className={`
                w-full
                px-3
                py-2.5
                border
                border-[#e5e7eb]
                rounded-lg
                text-sm
                placeholder-[#9ca3af]
                focus:outline-none
                transition-all
                duration-150
                bg-white
                ${icon ? 'pl-10' : ''}
                ${error ? 'border-[#ef4444]' : ''}
                ${className}
              `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-[#ef4444]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[#6b7280]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
