import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-[#f3f4f6] flex items-center justify-center`}>
          <User className={`${iconSizes[size]} text-[#6b7280]`} />
        </div>
      )}
    </div>
  );
}