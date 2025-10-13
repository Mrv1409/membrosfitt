'use client';

import { useAuthContext } from '@/contexts/AuthContexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
  const { signOut } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    signOut();
    router.push('/login');
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Saindo...</h2>
        <p className="text-gray-400">Você será redirecionado para a página de login em breve.</p>
      </div>
    </div>
  );
}
