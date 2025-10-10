import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#111827] mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
              className={`
                w-full
                px-3
                py-2
                border
                border-[#e5e7eb]
                rounded-lg
                text-sm
                focus:outline-none
                transition-colors
                duration-200
                bg-white
                ${error ? 'border-[#ef4444]' : ''}
                ${className}
              `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export default Select;
