'use client';
                                                        // eslint-disable-next-line
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Shield,   // eslint-disable-next-line  
  Bell,
  Settings,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Crown,
  Target,      // eslint-disable-next-line
  Calendar,    // eslint-disable-next-line 
  Clock,
  Eye,         // eslint-disable-next-line
  Filter,      // eslint-disable-next-line
  Download,    
  RefreshCw,   // eslint-disable-next-line
  Plus
} from 'lucide-react';

// Tipos para o dashboard
type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  plansGenerated: number;
  completionRate: number;
  churnRate: number;
};

type RecentActivity = {
  id: string;
  type: 'user_signup' | 'plan_generated' | 'upgrade' | 'completion';
  message: string;
  timestamp: Date;
  user: string;
};

type TopUser = {
  id: string;
  name: string;
  email: string;
  streak: number;
  completionRate: number;
  isPremium: boolean;
};

export default function AdminDashboard() {             // eslint-disable-next-line
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 2847,
    activeUsers: 1923,
    premiumUsers: 342,
    totalRevenue: 45890,
    monthlyRevenue: 12350,
    plansGenerated: 5634,
    completionRate: 78.5,
    churnRate: 4.2
  });
                                                                               // eslint-disable-next-line
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_signup',
      message: 'Novo usuário cadastrado: João Silva',
      timestamp: new Date(Date.now() - 5 * 60000),
      user: 'João Silva'
    },
    {
      id: '2', 
      type: 'upgrade',
      message: 'Upgrade para Premium: Maria Santos',
      timestamp: new Date(Date.now() - 15 * 60000),
      user: 'Maria Santos'
    },
    {
      id: '3',
      type: 'plan_generated',
      message: 'Plano gerado: Pedro Costa',
      timestamp: new Date(Date.now() - 30 * 60000),
      user: 'Pedro Costa'
    },
    {
      id: '4',
      type: 'completion',
      message: 'Meta atingida: Ana Oliveira (30 dias)',
      timestamp: new Date(Date.now() - 45 * 60000),
      user: 'Ana Oliveira'
    }
  ]);
                                                            // eslint-disable-next-line
  const [topUsers, setTopUsers] = useState<TopUser[]>([
    {
      id: '1',
      name: 'Carlos Fitness',
      email: 'carlos@email.com',
      streak: 45,
      completionRate: 95.2,
      isPremium: true
    },
    {
      id: '2',
      name: 'Marina Strong',
      email: 'marina@email.com', 
      streak: 38,
      completionRate: 89.7,
      isPremium: true
    },
    {
      id: '3',
      name: 'Lucas Beast',
      email: 'lucas@email.com',
      streak: 32,
      completionRate: 87.1,
      isPremium: false
    }
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Função para formatar números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Função para formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar tempo relativo
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  // Função para atualizar dados
  const refreshData = async () => {
    setIsLoading(true);
    // Simulação de API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">MarvinCode Fitness Control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</p>
                <p className="text-sm text-green-600 mt-1">+12% vs mês anterior</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.activeUsers)}</p>
                <p className="text-sm text-green-600 mt-1">+8% vs mês anterior</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Premium Users */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Premium</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.premiumUsers)}</p>
                <p className="text-sm text-yellow-600 mt-1">{((stats.premiumUsers/stats.totalUsers)*100).toFixed(1)}% conversão</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-sm text-green-600 mt-1">+23% vs mês anterior</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Performance Metrics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* KPIs Adicionais */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Métricas de Performance
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-blue-600" />  
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.plansGenerated)}</p>
                  <p className="text-sm text-gray-600">Planos Gerados</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                  <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.churnRate}%</p>
                  <p className="text-sm text-gray-600">Taxa de Churn</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-sm text-gray-600">Receita Total</p>
                </div>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                  Top Usuários
                </h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver todos
                </button>
              </div>
              
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          {user.isPremium && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        🔥 {user.streak} dias
                      </p>
                      <p className="text-sm text-green-600">
                        {user.completionRate}% conclusão
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Gerenciar Usuários</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">Ver Analytics</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Configurações</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 font-medium">Moderação</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Atividade Recente</h2>
                <Eye className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'user_signup' ? 'bg-blue-100' :
                      activity.type === 'upgrade' ? 'bg-yellow-100' :
                      activity.type === 'plan_generated' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {activity.type === 'user_signup' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'upgrade' && <Crown className="h-4 w-4 text-yellow-600" />}
                      {activity.type === 'plan_generated' && <Target className="h-4 w-4 text-green-600" />}
                      {activity.type === 'completion' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas atividades
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Status do Sistema</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Firebase</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">IA MarvinCode</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WhatsApp API</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">Pendente</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payments</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}