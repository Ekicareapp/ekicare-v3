'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, MapPin, User } from 'lucide-react'
import './globals.css'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard/pro', icon: LayoutDashboard },
  { name: 'Mes rendez-vous', href: '/dashboard/pro/rendez-vous', icon: CalendarDays },
  { name: 'Mes clients', href: '/dashboard/pro/clients', icon: Users },
  { name: 'Mes tournées', href: '/dashboard/pro/tournees', icon: MapPin },
  { name: 'Mon profil', href: '/dashboard/pro/profil', icon: User },
]

export default function ProDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Fermer la sidebar mobile quand on change de page
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#f9fafb] grid lg:grid-cols-[240px_1fr] grid-cols-1 lg:gap-6 gap-0">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white border border-[#e5e7eb] shadow-sm hover:bg-[#f9fafb] transition-colors duration-150"
        >
          <svg className="w-6 h-6 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col bg-white border-r border-[#e5e7eb] shadow-sm">
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e5e7eb] shadow-lg">
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
        </div>
      )}

      {/* Main content */}
      <main className="w-full px-6 lg:px-8 py-8 max-w-none">
        <Suspense fallback={<div>Chargement...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
