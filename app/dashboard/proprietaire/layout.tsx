'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Search, User, MessageCircle } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import AuthGuard from '@/components/AuthGuard'
import FeedbackModal from '@/components/FeedbackModal'
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
  const [showFeedback, setShowFeedback] = useState(false)
  const ENABLE_FEEDBACK = process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === 'true'
  const pathname = usePathname()
  const router = useRouter()


  return (
    <AuthGuard>
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
              {ENABLE_FEEDBACK && (
              <button
                onClick={() => { setShowFeedback(true); setSidebarOpen(false) }}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 min-h-[44px] text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]"
              >
                <MessageCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="break-words">Donner mon avis</span>
              </button>
              )}
              
              {/* Logout button */}
              <LogoutButton />
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
          {ENABLE_FEEDBACK && (
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full text-left sidebar-link flex items-center px-3 py-2.5 text-sm font-medium focus:outline-none text-[#6b7280] hover:text-[#111827]"
          >
            <MessageCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            Donner mon avis
          </button>
          )}
        </nav>

        {/* Logout button */}
        <div className="px-4 py-6 border-t border-[#e5e7eb]">
          <LogoutButton />
        </div>
      </div>


      {/* Main content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 max-w-none overflow-y-auto pt-12 lg:pt-8 lg:ml-[240px]">
        <div className="pt-12 lg:pt-0">
          {children}
        </div>
      </main>
      {ENABLE_FEEDBACK && showFeedback && (
        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      )}
      </div>
    </AuthGuard>
  )
}
