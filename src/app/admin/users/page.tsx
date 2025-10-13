'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, // eslint-disable-next-line
  limit, 
  where,
  getFirestore,
  Timestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { app, auth } from '@/lib/firebase';
import {
  Users,
  Search,                                   // eslint-disable-next-line
  Filter,      // eslint-disable-next-line
  MoreVertical, // eslint-disable-next-line
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  Crown,
  Calendar,   
  Mail,                                       // eslint-disable-next-line
  Phone,      
  ArrowLeft,
  RefreshCw,
  Download,         // eslint-disable-next-line
  UserPlus,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';

// Tipos
type UserData = {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  criadoEm: Timestamp;
  ultimoLogin?: Timestamp;
  planoAtivo: 'free' | 'premium';
  status: 'ativo' | 'suspenso' | 'inativo';
  planosGerados: number;
  taxaConclusao: number;
  receitaGerada: number;
  dadosUsuario?: {
    peso: number;
    altura: number;
    objetivo: string;
    biotipo: string;
  };
};

type FilterType = 'todos' | 'premium' | 'free' | 'ativos' | 'suspensos';

export default function AdminUsersPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const router = useRouter();


  const isAdmin = user?.email === 'marvincosta321@gmail.com'; 

  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const db = getFirestore(app);
      
      
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('criadoEm', 'desc')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: UserData[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        
        const planosQuery = query(
          collection(db, 'users', userDoc.id, 'planos')
        );
        const planosSnapshot = await getDocs(planosQuery);
        
      
        const profileQuery = query(
          collection(db, 'userProfile'),
          where('userId', '==', userDoc.id)
        );
        const profileSnapshot = await getDocs(profileQuery);
        const profileData = profileSnapshot.docs[0]?.data();

        
        const planosGerados = planosSnapshot.size;
        const taxaConclusao = Math.random() * 100; 
        const receitaGerada = userData.planoAtivo === 'premium' ? 29.90 : 0;

        usersData.push({
          id: userDoc.id,
          email: userData.email || '',
          nome: userData.nome || userData.displayName || 'Usuário',
          telefone: userData.telefone,
          criadoEm: userData.criadoEm || userData.createdAt,
          ultimoLogin: userData.ultimoLogin || userData.lastLoginAt,
          planoAtivo: userData.planoAtivo || 'free',
          status: userData.status || 'ativo',
          planosGerados,
          taxaConclusao,
          receitaGerada,
          dadosUsuario: profileData?.dadosUsuario
        });
      }

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários
  useEffect(() => {
    let filtered = users;

    // Filtro por tipo
    if (filterType !== 'todos') {
      filtered = filtered.filter(user => {
        switch (filterType) {
          case 'premium':
            return user.planoAtivo === 'premium';
          case 'free':
            return user.planoAtivo === 'free';
          case 'ativos':
            return user.status === 'ativo';
          case 'suspensos':
            return user.status === 'suspenso';
          default:
            return true;
        }
      });
    }

  
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, filterType, searchTerm]);


  const updateUserStatus = async (userId: string, newStatus: 'ativo' | 'suspenso') => {
    try {
      setActionLoading(true);
      const db = getFirestore(app);
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      alert(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'suspenso'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do usuário');
    } finally {
      setActionLoading(false);
    }
  };

  // Deletar usuário
  const deleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const db = getFirestore(app);
      
    
      await deleteDoc(doc(db, 'users', userId));
      
    
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      setShowDeleteModal(false);
      setSelectedUser(null);
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  // Formatar data
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // Paginação
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    if (!loadingAuth && user && isAdmin) {
      loadUsers();
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

  // Verificação de admin
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
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
                  <Users className="h-8 w-8 mr-3 text-blue-600" />
                  Gestão de Usuários
                </h1>
                <p className="text-gray-600">Gerencie todos os usuários da plataforma</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuários Premium</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.planoAtivo === 'premium').length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.status === 'ativo').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {users.reduce((acc, u) => acc + u.receitaGerada, 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-green-600">💰</div>
              </div>
            </div>
          </div>

          {/* Filtros e busca */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos os usuários</option>
                  <option value="premium">Premium</option>
                  <option value="free">Gratuito</option>
                  <option value="ativos">Ativos</option>
                  <option value="suspensos">Suspensos</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuários
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métricas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Carregando usuários...</p>
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum usuário encontrado</p>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.nome}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.planoAtivo === 'premium' ? (
                            <div className="flex items-center">
                              <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                              <span className="text-yellow-600 font-medium">Premium</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Gratuito</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : user.status === 'suspenso'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'ativo' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {user.status === 'suspenso' && <Ban className="h-3 w-3 mr-1" />}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Planos: {user.planosGerados}</div>
                          <div className="text-gray-500">Taxa: {user.taxaConclusao.toFixed(1)}%</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(user.criadoEm)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Visualizar usuário"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => updateUserStatus(user.id, user.status === 'ativo' ? 'suspenso' : 'ativo')}
                            disabled={actionLoading}
                            className={`p-1 rounded transition-colors ${
                              user.status === 'ativo' 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.status === 'ativo' ? 'Suspender usuário' : 'Ativar usuário'}
                          >
                            {user.status === 'ativo' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Deletar usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstUser + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> de{' '}
                      <span className="font-medium">{filteredUsers.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (page > totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Próximo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de visualização do usuário */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Detalhes do Usuário</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome</label>
                      <p className="text-sm text-gray-900">{selectedUser.nome}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Telefone</label>
                      <p className="text-sm text-gray-900">{selectedUser.telefone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-sm text-gray-900">{selectedUser.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Plano</label>
                      <p className="text-sm text-gray-900">{selectedUser.planoAtivo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Receita Gerada</label>
                      <p className="text-sm text-gray-900">R$ {selectedUser.receitaGerada.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {selectedUser.dadosUsuario && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Dados Físicos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Peso</label>
                          <p className="text-sm text-gray-900">{selectedUser.dadosUsuario.peso}kg</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Altura</label>
                          <p className="text-sm text-gray-900">{selectedUser.dadosUsuario.altura}cm</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Objetivo</label>
                          <p className="text-sm text-gray-900">{selectedUser.dadosUsuario.objetivo}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Biotipo</label>
                          <p className="text-sm text-gray-900">{selectedUser.dadosUsuario.biotipo}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Planos Gerados</label>
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.planosGerados}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Taxa de Conclusão</label>
                        <p className="text-2xl font-bold text-green-600">{selectedUser.taxaConclusao.toFixed(1)}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cadastrado em</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedUser.criadoEm)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => updateUserStatus(selectedUser.id, selectedUser.status === 'ativo' ? 'suspenso' : 'ativo')}
                    disabled={actionLoading}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                      selectedUser.status === 'ativo'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {actionLoading ? 'Processando...' : selectedUser.status === 'ativo' ? 'Suspender' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir o usuário <strong>{selectedUser.nome}</strong>? 
                  Esta ação não pode ser desfeita e todos os dados do usuário serão permanentemente removidos.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Excluindo...' : 'Excluir Usuário'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
