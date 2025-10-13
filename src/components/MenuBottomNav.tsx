'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Dumbbell,
  ListOrdered,
  ShieldCheck,
  Zap
} from 'lucide-react'

const tabs = [
  { name: 'Início', href: '/dashboard', icon: Home },
  { name: 'Gerar', href: '/gerar', icon: Zap }, // Adicionado o tab Gerar
  { name: 'Planos', href: '/dashboard/planos', icon: ListOrdered },
  { name: 'Progresso', href: '/dashboard/progresso', icon: Dumbbell },
  { name: 'Protocolos', href: '/dashboard/protocolos', icon: ShieldCheck }
]

export default function MenuBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-black text-white border-t border-white/10 z-50 md:hidden">
      <div className="max-w-md mx-auto"> {/* Centralizar em telas pequenas */}
        <ul className="flex justify-around items-center py-2 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <li key={tab.name} className="flex-1">
                <Link 
                  href={tab.href} 
                  className={`flex flex-col items-center text-xs py-2 px-1 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon 
                    className={`h-5 w-5 mb-1 ${
                      isActive ? 'text-green-400' : 'text-white/70'
                    }`} 
                  />
                  <span 
                    className={`text-[10px] leading-tight ${
                      isActive ? 'text-green-400 font-medium' : 'text-white/70'
                    }`}
                  >
                    {tab.name}
                  </span>
                  {/* Indicador visual para aba ativa */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}