interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

export default function Avatar({ 
  src, 
  alt = '', 
  size = 'md', 
  className = '', 
  children 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div className={`
      ${sizeClasses[size]}
      rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600
      ${className}
    `}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        children
      )}
    </div>
  );
}
