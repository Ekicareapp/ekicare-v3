'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LogoutButton from '@/components/LogoutButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/proprietaire' },
  { name: 'Mes équidés', href: '/dashboard/proprietaire/equides' },
  { name: 'Mes rendez-vous', href: '/dashboard/proprietaire/rendez-vous' },
  { name: 'Recherche pro', href: '/dashboard/proprietaire/recherche-pro' },
  { name: 'Mon profil', href: '/dashboard/proprietaire/profil' },
];

export default function Sidebar({ isOpen, onClose, isDesktop }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();


  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${
      isDesktop ? 'w-64' : 'w-full'
    }`}>
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-gray-200">
        <img 
          src="/logo-ekicare.png" 
          alt="EkiCare" 
          className="w-10 h-10 rounded-lg"
        />
        <span className="ml-3 text-xl font-semibold text-gray-900">EkiCare</span>
        {!isDesktop && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-[#f86f4d] text-white' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={!isDesktop ? onClose : undefined}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="px-4 py-4 border-t border-gray-200">
        <LogoutButton />
      </div>
    </div>
  );
}
