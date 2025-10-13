'use client';

import React, { useState } from 'react';
import {                                                            
  CreditCard, DollarSign, TrendingUp, Users, 
  Download, RefreshCw, Search, Crown, Calendar, BarChart3, ArrowUpRight,
  Eye, Edit, Ban, X
} from 'lucide-react';

type PaymentStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  conversionRate: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  pendingPayments: number;
};

type Subscription = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'pending' | 'expired';
  amount: number;
  startDate: Date;
  nextPayment: Date;
  paymentMethod: 'stripe' | 'pagseguro' | 'pix';
  lastPayment: Date;
};

type Transaction = {
  id: string;
  userId: string;
  userName: string;
  type: 'subscription' | 'upgrade' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  amount: number;
  date: Date;
  paymentMethod: string;
  transactionId: string;
};

export default function AdminPayments() {
  const [stats] = useState<PaymentStats>({
    totalRevenue: 127450,
    monthlyRevenue: 23890,
    activeSubscriptions: 723,
    conversionRate: 18.5,
    churnRate: 4.8,
    averageRevenuePerUser: 89.50,
    lifetimeValue: 450.00,
    pendingPayments: 35
  });

  const [subscriptions] = useState<Subscription[]>([
    {
      id: '1', userId: 'user1', userName: 'Carlos Silva', userEmail: 'carlos@email.com',
      plan: 'premium', status: 'active', amount: 29.90,
      startDate: new Date('2024-01-15'), nextPayment: new Date('2025-06-15'),
      paymentMethod: 'stripe', lastPayment: new Date('2025-05-15')
    }
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: '1', userId: 'user1', userName: 'Carlos Silva', type: 'subscription',
      status: 'completed', amount: 29.90, date: new Date('2025-05-15'),
      paymentMethod: 'Stripe', transactionId: 'pi_1234567890'
    }
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subscriptions' | 'transactions'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled' | 'pending'>('all');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      cancelled: 'text-red-600 bg-red-100',
      failed: 'text-red-600 bg-red-100',
      expired: 'text-gray-600 bg-gray-100',
      refunded: 'text-blue-600 bg-blue-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      basic: 'text-blue-600 bg-blue-100',
      premium: 'text-purple-600 bg-purple-100',
      pro: 'text-yellow-600 bg-yellow-100'
    };
    return colors[plan as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      subscription: 'text-green-600 bg-green-100',
      upgrade: 'text-purple-600 bg-purple-100',
      refund: 'text-red-600 bg-red-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const refreshData = async () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSubscriptionAction = (action: string, subscription: Subscription) => {
    if (action === 'view') {
      setSelectedSubscription(subscription);
      setShowSubscriptionModal(true);
    }
  };

  const exportData = () => {
    console.log('Exportando dados...');
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredTransactions = transactions.filter(trans => {
    const matchesSearch = trans.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trans.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = transactionFilter === 'all' || trans.status === transactionFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pagamentos & Assinaturas</h1>
                <p className="text-sm text-gray-500">Gestão financeira do MarvinCode MembrosFit</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="border-b">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
                { id: 'subscriptions', name: 'Assinaturas', icon: Users },
                { id: 'transactions', name: 'Transações', icon: CreditCard }
              ].map((tab) => (
                <button
                  key={tab.id}                                      // eslint-disable-next-line
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-green-900 text-green-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {selectedTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Receita Total</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-green-900 mt-1 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +23% vs mês anterior
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Receita Mensal</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-sm text-green-900 mt-1 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +15% vs mês anterior
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assinaturas Ativas</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                    <p className="text-sm text-green-900 mt-1 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      +8% vs mês anterior
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
                    <p className="text-sm text-red-900 mt-1">-2% vs mês anterior</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Receita Mensal</h2>
                <div className="h-64 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de receita</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Métricas</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700">ARPU</span>
                    <span className="font-semibold">{formatCurrency(stats.averageRevenuePerUser)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">LTV</span>
                    <span className="font-semibold">{formatCurrency(stats.lifetimeValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Taxa de Churn</span>
                    <span className="font-semibold text-red-900">{stats.churnRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pendentes</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingPayments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar usuário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                  <select
                    value={filterStatus}                                        // eslint-disable-next-line
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <button onClick={exportData} className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Assinaturas ({filteredSubscriptions.length})
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próximo Pagamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                            <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(subscription.plan)}`}>
                            {subscription.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                            {subscription.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(subscription.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(subscription.nextPayment)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSubscriptionAction('view', subscription)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Ban className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar transação..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                  <select
                    value={transactionFilter}                                         // eslint-disable-next-line
                    onChange={(e) => setTransactionFilter(e.target.value as any)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">Todos</option>
                    <option value="completed">Concluído</option>
                    <option value="pending">Pendente</option>
                    <option value="failed">Falhou</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>
                <button onClick={exportData} className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Transações ({filteredTransactions.length})
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {transaction.transactionId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
                          <div className="text-sm text-gray-500">{transaction.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(transaction.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showSubscriptionModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalhes da Assinatura</h3>
                <button 
                  onClick={() => setShowSubscriptionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Usuário</label>
                  <p className="text-gray-900">{selectedSubscription.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedSubscription.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Plano</label>
                  <p className="text-gray-900">{selectedSubscription.plan.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubscription.status)}`}>
                    {selectedSubscription.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  <p className="text-gray-900">{formatCurrency(selectedSubscription.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Próximo Pagamento</label>
                  <p className="text-gray-900">{formatDate(selectedSubscription.nextPayment)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Método de Pagamento</label>
                  <p className="text-gray-900">{selectedSubscription.paymentMethod.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">
                  Editar
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}