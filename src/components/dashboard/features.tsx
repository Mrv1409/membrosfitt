'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

interface FeaturesProps {
  features: Feature[];
}

export function Features({ features }: FeaturesProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card
          key={feature.title}
          className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center gap-4 p-4">
            {feature.icon}
            <div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(feature.href)}
          >
            Acessar
          </Button>
        </Card>
      ))}
    </div>
  );
}

export const featuresData: Feature[] = [
  {
    title: 'Novo Membro',
    description: 'Cadastre novos membros do seu academia',
    icon: <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">👤</div>,
    href: '/members/new'
  },
  {
    title: 'Nova Aula',
    description: 'Agende novas aulas para seus alunos',
    icon: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">📅</div>,
    href: '/classes/new'
  },
  {
    title: 'Nova Mensalidade',
    description: 'Registre pagamentos e controle suas finanças',
    icon: <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">💰</div>,
    href: '/payments/new'
  },
  {
    title: 'Nova Turma',
    description: 'Organize seus grupos de treino',
    icon: <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">👥</div>,
    href: '/groups/new'
  }
];
