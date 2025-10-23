import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { payableReceivableService, clientSupplierService, bankService, userService } from '../services';
import { PayableReceivable, ClientSupplier, Bank, User } from '../types';

const PayablesReceivables: React.FC = () => {
  const [payablesReceivables, setPayablesReceivables] = useState<PayableReceivable[]>([]);
  const [filteredData, setFilteredData] = useState<PayableReceivable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PayableReceivable | null>(null);
  const [payingItem, setPayingItem] = useState<PayableReceivable | null>(null);
  const [loading, setLoading] = useState(true);

  const [clientSuppliers, setClientSuppliers] = useState<ClientSupplier[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [payablesData, clientsData, banksData, userData] = await Promise.all([
          payableReceivableService.getAll(),
          clientSupplierService.getAll(),
          bankService.getAll(),
          userService.getCurrentUser()
        ]);
        setPayablesReceivables(payablesData);
        setClientSuppliers(clientsData);
        setBanks(banksData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    filterData();
  }, [payablesReceivables, searchTerm, filterType, filterStatus]);

  const loadData = async () => {
    try {
      const data = await payableReceivableService.getAll();
      setPayablesReceivables(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = payablesReceivables;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por data de vencimento
    filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: PayableReceivable) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handlePay = (item: PayableReceivable) => {
    setPayingItem(item);
    setShowPayModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const index = payablesReceivables.findIndex(pr => pr.id === id);
        if (index !== -1) {
          payablesReceivables.splice(index, 1);
          loadData();
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir item');
      }
    }
  };

  const getClientSupplierName = (id: string) => {
    const clientSupplier = clientSuppliers.find(cs => cs.id === id);
    return clientSupplier ? clientSupplier.tradeName : 'Não encontrado';
  };

  const getStatusIcon = (status: string, dueDate: Date) => {
    const today = new Date();
    const isOverdue = dueDate < today && status === 'pending';
    
    if (isOverdue) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, dueDate: Date) => {
    const today = new Date();
    const isOverdue = dueDate < today && status === 'pending';
    
    if (isOverdue) {
      return 'Vencida';
    }
    
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string, dueDate: Date) => {
    const today = new Date();
    const isOverdue = dueDate < today && status === 'pending';
    
    if (isOverdue) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
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
          <h1 className="text-2xl font-bold text-secondary-900">Contas a Pagar e Receber</h1>
          <p className="text-secondary-600">Gerencie as duplicatas da empresa</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Duplicata
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'payable' | 'receivable')}
              className="input-field"
            >
              <option value="all">Todos os tipos</option>
              <option value="payable">Contas a Pagar</option>
              <option value="receivable">Contas a Receber</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid' | 'overdue')}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Contas a Pagar</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(
                  payablesReceivables
                    .filter(pr => pr.type === 'payable' && pr.status === 'pending')
                    .reduce((sum, pr) => sum + pr.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Contas a Receber</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(
                  payablesReceivables
                    .filter(pr => pr.type === 'receivable' && pr.status === 'pending')
                    .reduce((sum, pr) => sum + pr.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Pendentes</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {payablesReceivables.filter(pr => pr.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Pagas</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {payablesReceivables.filter(pr => pr.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Cliente/Fornecedor</th>
                <th className="px-6 py-3 text-left">Descrição</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-left">Vencimento</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-secondary-500">
                    Nenhuma duplicata encontrada
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="table-cell font-medium">
                      {getClientSupplierName(item.clientSupplierId)}
                    </td>
                    <td className="table-cell">{item.description}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'payable' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'payable' ? 'A Pagar' : 'A Receber'}
                      </span>
                    </td>
                    <td className="table-cell text-right font-semibold">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="table-cell">{formatDate(item.dueDate)}</td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center">
                        {getStatusIcon(item.status, item.dueDate)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status, item.dueDate)}`}>
                          {getStatusText(item.status, item.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handlePay(item)}
                            className="p-2 text-secondary-400 hover:text-green-600 transition-colors"
                            title="Pagar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

      {/* Modais */}
      {showModal && (
        <PayableReceivableModal
          item={editingItem}
          clientSuppliers={clientSuppliers}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}

      {showPayModal && payingItem && (
        <PayModal
          item={payingItem}
          banks={banks}
          onClose={() => setShowPayModal(false)}
          onSave={() => {
            setShowPayModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Modal para criar/editar duplicata
interface PayableReceivableModalProps {
  item: PayableReceivable | null;
  onClose: () => void;
  onSave: () => void;
  clientSuppliers: ClientSupplier[];
  currentUser: User | null;
}

const PayableReceivableModal: React.FC<PayableReceivableModalProps> = ({ item, onClose, onSave, clientSuppliers, currentUser }) => {
  const [formData, setFormData] = useState({
    clientSupplierId: '',
    type: 'payable' as 'payable' | 'receivable',
    amount: 0,
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        clientSupplierId: item.clientSupplierId,
        type: item.type,
        amount: item.amount,
        dueDate: item.dueDate.toISOString().split('T')[0],
        description: item.description
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (item) {
        await payableReceivableService.update(item.id, {
          ...formData,
          dueDate: new Date(formData.dueDate),
          updatedAt: new Date()
        });
      } else {
        await payableReceivableService.create({
          ...formData,
          dueDate: new Date(formData.dueDate),
          status: 'pending',
          userId: currentUser?.id || '1'
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
                {item ? 'Editar' : 'Nova'} Duplicata
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente/Fornecedor *
                  </label>
                  <select
                    value={formData.clientSupplierId}
                    onChange={(e) => setFormData({ ...formData, clientSupplierId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Selecione um cliente/fornecedor</option>
                    {clientSuppliers.map(cs => (
                      <option key={cs.id} value={cs.id}>{cs.tradeName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'payable' | 'receivable' })}
                    className="input-field"
                    required
                  >
                    <option value="payable">Conta a Pagar</option>
                    <option value="receivable">Conta a Receber</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                {item ? 'Atualizar' : 'Criar'}
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

// Modal para pagar duplicata
interface PayModalProps {
  item: PayableReceivable;
  onClose: () => void;
  onSave: () => void;
  banks: Bank[];
}

const PayModal: React.FC<PayModalProps> = ({ item, onClose, onSave, banks }) => {
  const [formData, setFormData] = useState({
    paidAmount: item.amount,
    bankId: ''
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await payableReceivableService.pay(item.id, formData.paidAmount, formData.bankId);
      onSave();
    } catch (error) {
      console.error('Erro ao pagar:', error);
      alert('Erro ao processar pagamento');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pagar Duplicata
              </h3>
              
              <div className="space-y-4">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <p className="text-sm text-secondary-600">Descrição:</p>
                  <p className="font-medium text-secondary-900">{item.description}</p>
                  <p className="text-sm text-secondary-600 mt-1">Valor Original:</p>
                  <p className="font-semibold text-secondary-900">{formatCurrency(item.amount)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor a Pagar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={item.amount}
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banco *
                  </label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Selecione um banco</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                Confirmar Pagamento
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

export default PayablesReceivables;
