'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
            <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] rounded-lg transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}