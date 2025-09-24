'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PawPrint, CalendarDays, Search, User } from 'lucide-react'
import './globals.css'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/proprietaire', icon: LayoutDashboard },
  { name: 'Mes équidés', href: '/dashboard/proprietaire/equides', icon: PawPrint },
  { name: 'Mes rendez-vous', href: '/dashboard/proprietaire/rendez-vous', icon: CalendarDays },
  { name: 'Trouver un pro', href: '/dashboard/proprietaire/recherche-pro', icon: Search },
  { name: 'Mon profil', href: '/dashboard/proprietaire/profil', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f9fafb] grid lg:grid-cols-[240px_1fr] grid-cols-1 lg:gap-6 gap-0">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-150"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-sm">
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
        <div className="px-4 py-4 border-t border-gray-200">
          <button className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg transition-all duration-150 focus:outline-none">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-6">
                <div className="flex items-center">
                  <div className="w-8 h-8">
                    <img 
                      src="/logo-ekicare.png" 
                      alt="EkiCare" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 transition-colors p-1 rounded-md focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                          onClick={() => setSidebarOpen(false)}
                        >
                      <IconComponent className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout button */}
              <div className="px-4 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    // TODO: Implement logout logic
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg transition-all duration-150 focus:outline-none"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="w-full px-6 lg:px-8 py-8 max-w-none">
        {children}
      </main>
    </div>
  )
}
