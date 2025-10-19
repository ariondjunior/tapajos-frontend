import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { userService, reportService } from '../services';
import { User, UserAudit } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAudit[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<UserAudit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      loadUserAudit();
    }
  }, [selectedUser]);

  const loadData = async () => {
    try {
      const userData = await userService.getAll();
      setUsers(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAudit = async () => {
    try {
      const auditData = await reportService.getUserAudit(selectedUser);
      setAuditLogs(auditData);
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => user.isActive);

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = (id: string) => {
    if (window.confirm('Tem certeza que deseja alterar o status deste usuário?')) {
      try {
        const user = users.find(u => u.id === id);
        if (user) {
          user.isActive = !user.isActive;
          loadData();
        }
      } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert('Erro ao alterar status do usuário');
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users.splice(index, 1);
          loadData();
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Usuários</h1>
          <p className="text-secondary-600">Gerencie usuários e visualize auditoria</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAuditModal(true)}
            className="btn-secondary flex items-center"
          >
            <Eye className="h-5 w-5 mr-2" />
            Auditoria Geral
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="input-field"
            >
              <option value="">Selecione um usuário para auditoria</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Usuários Cadastrados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Função</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-left">Data Cadastro</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-secondary-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50">
                    <td className="table-cell font-medium">{user.name}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="table-cell">{formatDate(user.createdAt)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-2 transition-colors ${
                            user.isActive 
                              ? 'text-secondary-400 hover:text-red-600' 
                              : 'text-secondary-400 hover:text-green-600'
                          }`}
                          title={user.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                          title="Excluir"
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
      </div>

      {/* Auditoria do usuário selecionado */}
      {selectedUser && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Auditoria - {users.find(u => u.id === selectedUser)?.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Data/Hora</th>
                  <th className="px-6 py-3 text-left">Ação</th>
                  <th className="px-6 py-3 text-left">Entidade</th>
                  <th className="px-6 py-3 text-left">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-secondary-500">
                      Nenhuma ação registrada para este usuário
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((audit) => (
                    <tr key={audit.id}>
                      <td className="table-cell">{formatDate(audit.timestamp)}</td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          audit.action === 'CREATE' 
                            ? 'bg-green-100 text-green-800'
                            : audit.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : audit.action === 'DELETE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {audit.action}
                        </span>
                      </td>
                      <td className="table-cell">{audit.entityType}</td>
                      <td className="table-cell">{audit.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}

      {showAuditModal && (
        <AuditModal
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
};

// Modal para criar/editar usuário
interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (user) {
        await userService.update(user.id, formData);
      } else {
        await userService.create({
          ...formData,
          isActive: true
        });
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {user ? 'Editar' : 'Novo'} Usuário
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                    className="input-field"
                    required
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                {user ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para auditoria geral
interface AuditModalProps {
  onClose: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({ onClose }) => {
  const [auditLogs, setAuditLogs] = useState<UserAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const data = await reportService.getUserAudit();
      setAuditLogs(data);
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Auditoria Geral do Sistema
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-3 text-left">Data/Hora</th>
                      <th className="px-6 py-3 text-left">Usuário</th>
                      <th className="px-6 py-3 text-left">Ação</th>
                      <th className="px-6 py-3 text-left">Entidade</th>
                      <th className="px-6 py-3 text-left">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="table-cell text-center text-secondary-500">
                          Nenhuma ação registrada
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((audit) => (
                        <tr key={audit.id}>
                          <td className="table-cell">{formatDate(audit.timestamp)}</td>
                          <td className="table-cell">{audit.userId}</td>
                          <td className="table-cell">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              audit.action === 'CREATE' 
                                ? 'bg-green-100 text-green-800'
                                : audit.action === 'UPDATE'
                                ? 'bg-blue-100 text-blue-800'
                                : audit.action === 'DELETE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {audit.action}
                            </span>
                          </td>
                          <td className="table-cell">{audit.entityType}</td>
                          <td className="table-cell">{audit.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
