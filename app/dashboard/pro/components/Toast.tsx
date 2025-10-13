'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Toujours fond clair neutre
  const containerClasses = 'bg-white border border-gray-200 shadow-lg rounded-lg';

  return (
    <div
      className={`fixed z-50 transform transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        // Position responsive: mobile top-centered (90% width), desktop top-right
        'top-8 left-1/2 -translate-x-1/2 w-[90%] sm:left-auto sm:translate-x-0 sm:right-4 sm:w-auto sm:top-8'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-center justify-between gap-3 px-4 py-3 w-full ${containerClasses}`}>
        <div className="flex items-center gap-3 min-w-0">
          {getIcon()}
          <span className="text-sm font-medium text-gray-800 break-words">
            {message}
          </span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}