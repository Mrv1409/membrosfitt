'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  doc, 
  getDoc,
  setDoc,          
  getFirestore,
  Timestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { app, auth } from '@/lib/firebase';
import {
  Settings,
  ArrowLeft,
  Save,
  RefreshCw,
  DollarSign,       // eslint-disable-next-line
  Mail,        
  Database,     
  Bell,         
  Globe,        
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Tipos
type SettingsData = {
  pricing: {
    premiumPrice: number;
    currency: string;
    trialDays: number;
  };
  features: {
    aiGeneration: boolean;
    customWorkouts: boolean;
    nutritionPlans: boolean;
    progressTracking: boolean;
    communityAccess: boolean;
    personalTrainer: boolean;
  };
  platform: {
    siteName: string;
    supportEmail: string;
    maxFreeWorkouts: number;
    maintenanceMode: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    lastBackup?: Timestamp;
  };
};

export default function AdminSettingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [settings, setSettings] = useState<SettingsData>({
    pricing: {
      premiumPrice: 29.90,
      currency: 'BRL',
      trialDays: 7
    },
    features: {
      aiGeneration: true,
      customWorkouts: true,
      nutritionPlans: true,
      progressTracking: true,
      communityAccess: false,
      personalTrainer: false
    },
    platform: {
      siteName: 'MEMBROS FIT',
      supportEmail: 'suporte@personalpump.com.br',
      maxFreeWorkouts: 3,
      maintenanceMode: false
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: true,
      weeklyReports: true,
      marketingEmails: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');
  const router = useRouter();

  
  const isAdmin = user?.email === 'marvincosta321@gmail.com'; 

  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const db = getFirestore(app);
      const settingsRef = doc(db, 'settings', 'global');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as SettingsData;
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const saveSettings = async () => {
    try {
      setSaving(true);
      const db = getFirestore(app);
      const settingsRef = doc(db, 'settings', 'global');
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy: user?.email
      }, { merge: true });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  
  const performBackup = async () => {
    try {
      setSaving(true);
      const db = getFirestore(app);
      const backupRef = doc(db, 'backups', `backup_${new Date().getTime()}`);
      
      await setDoc(backupRef, {
        settings,
        timestamp: Timestamp.now(),
        type: 'manual'
      });

      // Atualizar último backup
      setSettings(prev => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: Timestamp.now()
        }
      }));

      alert('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      alert('Erro ao realizar backup');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loadingAuth && user && isAdmin) {
      loadSettings();
    } else if (!loadingAuth && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loadingAuth, isAdmin, router]);

  
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  
  if (!user || !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'pricing', label: 'Preços', icon: DollarSign },
    { id: 'features', label: 'Recursos', icon: Settings },
    { id: 'platform', label: 'Plataforma', icon: Globe },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar ao Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Settings className="h-8 w-8 mr-3 text-blue-600" />
                  Configurações do Sistema
                </h1>
                <p className="text-gray-600">Gerencie as configurações globais da plataforma</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSettings}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recarregar
              </button>
              
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          
          {showSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-800">Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>

        <div className="flex space-x-6">
          {/* Sidebar de navegação */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                
                {activeTab === 'pricing' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <DollarSign className="h-6 w-6 mr-2 text-blue-600" />
                      Configurações de Preços
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preço Premium (mensal)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={settings.pricing.premiumPrice}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                pricing: { ...prev.pricing, premiumPrice: parseFloat(e.target.value) }
                              }))}
                              className="pl-8 pr-4 py-2 w-full border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moeda
                          </label>
                          <select
                            value={settings.pricing.currency}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, currency: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="BRL">Real (BRL)</option>
                            <option value="USD">Dólar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dias de Trial
                          </label>
                          <input
                            type="number"
                            value={settings.pricing.trialDays}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, trialDays: parseInt(e.target.value) }
                            }))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Recursos */}
                {activeTab === 'features' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <Settings className="h-6 w-6 mr-2 text-blue-900" />
                      Recursos da Plataforma
                    </h2>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.features).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {key === 'aiGeneration' && 'Geração com IA'}
                              {key === 'customWorkouts' && 'Treinos Personalizados'}
                              {key === 'nutritionPlans' && 'Planos Nutricionais'}
                              {key === 'progressTracking' && 'Acompanhamento de Progresso'}
                              {key === 'communityAccess' && 'Acesso à Comunidade'}
                              {key === 'personalTrainer' && 'Personal Trainer Online'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {key === 'aiGeneration' && 'Permite geração automática de treinos com IA'}
                              {key === 'customWorkouts' && 'Usuários podem criar treinos personalizados'}
                              {key === 'nutritionPlans' && 'Acesso a planos de alimentação'}
                              {key === 'progressTracking' && 'Acompanhamento detalhado do progresso'}
                              {key === 'communityAccess' && 'Acesso ao fórum e comunidade'}
                              {key === 'personalTrainer' && 'Consultoria com personal trainer'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                features: { ...prev.features, [key]: e.target.checked }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Plataforma */}
                {activeTab === 'platform' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <Globe className="h-6 w-6 mr-2 text-blue-900" />
                      Configurações da Plataforma
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Site
                          </label>
                          <input
                            type="text"
                            value={settings.platform.siteName}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              platform: { ...prev.platform, siteName: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email de Suporte
                          </label>
                          <input
                            type="email"
                            value={settings.platform.supportEmail}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              platform: { ...prev.platform, supportEmail: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Máximo de Treinos Gratuitos
                          </label>
                          <input
                            type="number"
                            value={settings.platform.maxFreeWorkouts}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              platform: { ...prev.platform, maxFreeWorkouts: parseInt(e.target.value) }
                            }))}
                            className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Modo de Manutenção</h3>
                          <p className="text-sm text-gray-500">Ativa o modo de manutenção para toda a plataforma</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.platform.maintenanceMode}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              platform: { ...prev.platform, maintenanceMode: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Notificações */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <Bell className="h-6 w-6 mr-2 text-blue-900" />
                      Configurações de Notificações
                    </h2>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {key === 'emailEnabled' && 'Notificações por Email'}
                              {key === 'pushEnabled' && 'Notificações Push'}
                              {key === 'weeklyReports' && 'Relatórios Semanais'}
                              {key === 'marketingEmails' && 'Emails de Marketing'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {key === 'emailEnabled' && 'Permite envio de emails de notificação'}
                              {key === 'pushEnabled' && 'Permite notificações push no navegador'}
                              {key === 'weeklyReports' && 'Envia relatórios semanais para usuários'}
                              {key === 'marketingEmails' && 'Permite emails promocionais'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                notifications: { ...prev.notifications, [key]: e.target.checked }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Backup */}
                {activeTab === 'backup' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <Database className="h-6 w-6 mr-2 text-blue-900" />
                      Configurações de Backup
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Backup Automático</h3>
                          <p className="text-sm text-gray-500">Realiza backup automático dos dados do sistema</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.backup.autoBackup}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              backup: { ...prev.backup, autoBackup: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequência do Backup
                        </label>
                        <select
                          value={settings.backup.backupFrequency}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            backup: { ...prev.backup, backupFrequency: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                      
                      {settings.backup.lastBackup && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            Último backup realizado em: {settings.backup.lastBackup.toDate().toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={performBackup}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        {saving ? 'Fazendo Backup...' : 'Fazer Backup Manual'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}