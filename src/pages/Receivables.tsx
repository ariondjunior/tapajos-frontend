import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { payableReceivableService, clientSupplierService, bankService, userService } from '../services';
import { PayableReceivable, ClientSupplier, Bank, User } from '../types';

const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<PayableReceivable[]>([]);
  const [filteredData, setFilteredData] = useState<PayableReceivable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        const [receivablesData, clientsData, banksData, userData] = await Promise.all([
          payableReceivableService.getAll(),
          clientSupplierService.getAll(),
          bankService.getAll(),
          userService.getCurrentUser()
        ]);
        // Filtra apenas contas a receber
        const filtered = receivablesData.filter(item => item.type === 'receivable');
        setReceivables(filtered);
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
  }, [receivables, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      const data = await payableReceivableService.getAll();
      const filtered = data.filter(item => item.type === 'receivable');
      setReceivables(filtered);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const filterData = () => {
    let filtered = receivables;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
        const index = receivables.findIndex(pr => pr.id === id);
        if (index !== -1) {
          receivables.splice(index, 1);
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
    
    if (isOverdue) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'paid') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: string, dueDate: Date) => {
    const today = new Date();
    const isOverdue = dueDate < today && status === 'pending';
    if (isOverdue) return 'Vencida';
    return status === 'paid' ? 'Recebida' : 'Pendente';
  };

  const getStatusColor = (status: string, dueDate: Date) => {
    const today = new Date();
    const isOverdue = dueDate < today && status === 'pending';
    if (isOverdue) return 'bg-red-100 text-red-800';
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
          <h1 className="text-2xl font-bold text-secondary-900">Contas a Receber</h1>
          <p className="text-secondary-600">Gerencie as duplicatas de clientes</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Nova Conta a Receber
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Recebido</option>
              <option value="overdue">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total a Receber</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(
                  receivables.filter(pr => pr.status === 'pending').reduce((sum, pr) => sum + pr.amount, 0)
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
                {receivables.filter(pr => pr.status === 'pending').length}
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
              <p className="text-sm font-medium text-secondary-600">Recebidas</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {receivables.filter(pr => pr.status === 'paid').length}
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
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Descrição</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-left">Vencimento</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-secondary-500">
                    Nenhuma conta a receber encontrada
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="table-cell font-medium">{getClientSupplierName(item.clientSupplierId)}</td>
                    <td className="table-cell">{item.description}</td>
                    <td className="table-cell text-right font-semibold">{formatCurrency(item.amount)}</td>
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
                            title="Receber"
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

      {/* Modais - usar os mesmos do PayablesReceivables */}
    </div>
  );
};

export default Receivables;