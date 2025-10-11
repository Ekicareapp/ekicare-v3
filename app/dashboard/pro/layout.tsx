'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, MapPin, User } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import AuthGuard from '@/components/AuthGuard'
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
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // 🚧 MODE DÉVELOPPEMENT - DÉSACTIVATION TEMPORAIRE DES VÉRIFICATIONS
  const DEV_MODE = process.env.NODE_ENV === 'development'

  // Vérifier si le professionnel est vérifié
  useEffect(() => {
    // 🚧 MODE DÉVELOPPEMENT - BYPASS DES VÉRIFICATIONS
    if (DEV_MODE) {
      console.log('🚧 MODE DÉVELOPPEMENT: Vérifications de rôle désactivées - Accès libre au dashboard Pro')
      setIsVerified(true)
      return
    }

    const checkVerification = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        
        // Vérifier si l'utilisateur est vérifié
        const isVerified = data.profile && data.profile.is_verified === true
        const isSubscribed = data.profile && data.profile.is_subscribed === true
        
        console.log('🔍 Vérification du statut:', { isVerified, isSubscribed, retryCount })
        
        if (isVerified || isSubscribed) {
          setIsVerified(true)
        } else if (retryCount < 5) {
          // Retry après un délai si pas encore vérifié (pour laisser le temps au webhook)
          console.log(`⏳ Statut non vérifié, retry ${retryCount + 1}/5 dans 3 secondes...`)
          setTimeout(() => checkVerification(retryCount + 1), 3000)
        } else {
          console.log('❌ Statut non vérifié après 5 tentatives')
          setIsVerified(false)
          router.push('/paiement-requis')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error)
        if (retryCount < 5) {
          setTimeout(() => checkVerification(retryCount + 1), 3000)
        } else {
          setIsVerified(false)
          router.push('/paiement-requis')
        }
      }
    }
    
    checkVerification()
  }, [router])

  // Fermer la sidebar mobile quand on change de page
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Afficher un loader pendant la vérification
  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Vérification en cours...</p>
        </div>
      </div>
    )
  }

  // Si non vérifié, ne pas afficher le dashboard
  if (isVerified === false) {
    return null
  }

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
        </nav>

        {/* Logout button */}
        <div className="px-4 py-6 border-t border-[#e5e7eb]">
          <LogoutButton />
        </div>
      </div>


      {/* Main content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 max-w-none overflow-y-auto pt-12 lg:pt-8 lg:ml-[240px]">
        <div className="pt-12 lg:pt-0">
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
      </div>
    </AuthGuard>
  )
}
