'use client'

import { useAuthContext } from '@/contexts/AuthContexts'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MenuBottomNav from '@/components/MenuBottomNav'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { currentUser } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push('/login')
    }
  }, [currentUser, router])

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* CONTEÚDO DIRETO - SEM CABEÇALHO */}
      <main className="flex-1 w-full overflow-auto">
        {children}
      </main>

      <MenuBottomNav />
    </div>
  )
}