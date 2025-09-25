'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Search, User } from 'lucide-react'
import './globals.css'

// Icône custom de fer à cheval
const HorseshoeIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 20c0-6.627 2.686-12 6-12s6 5.373 6 12"/>
    <path d="M6 20c0-7.732 3.582-14 8-14s8 6.268 8 14"/>
    <circle cx="8" cy="18" r="1"/>
    <circle cx="16" cy="18" r="1"/>
    <circle cx="7" cy="16" r="1"/>
    <circle cx="17" cy="16" r="1"/>
  </svg>
)

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/proprietaire', icon: LayoutDashboard },
  { name: 'Mes équidés', href: '/dashboard/proprietaire/equides', icon: HorseshoeIcon },
  { name: 'Mes rendez-vous', href: '/dashboard/proprietaire/rendez-vous', icon: CalendarDays },
  { name: 'Trouver un pro', href: '/dashboard/proprietaire/recherche-pro', icon: Search },
  { name: 'Mon profil', href: '/dashboard/proprietaire/profil', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f9fafb] flex overflow-x-hidden">
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8">
              <img
                src="/logo-ekicare.png"
                alt="EkiCare"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Burger button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#f9fafb] transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile dropdown menu */}
        {sidebarOpen && (
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-[#e5e7eb] shadow-lg z-40">
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 min-h-[44px] ${
                      isActive
                        ? 'bg-[#fef2f2] text-[#f86f4d]'
                        : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="break-words">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Logout button */}
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  // TODO: Implement logout logic
                }}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-150 min-h-[44px]"
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="break-words">Déconnexion</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-screen w-[240px] min-w-[240px] bg-white border-r border-[#e5e7eb] shadow-sm">
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <div className="w-8 h-8">
            <img 
              src="/logo-ekicare.png" 
              alt="EkiCare" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
                  <Link
                    key={item.name}
                    href={item.href}
                      className={`sidebar-link flex items-center px-3 py-2.5 text-sm font-medium focus:outline-none ${
                        isActive
                          ? 'active'
                          : 'text-[#6b7280] hover:text-[#111827]'
                      }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="px-4 py-6 border-t border-[#e5e7eb]">
          <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] rounded-lg transition-colors duration-150">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>


      {/* Main content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 max-w-none overflow-y-auto pt-12 lg:pt-8 lg:ml-[240px]">
        <div className="pt-12 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
