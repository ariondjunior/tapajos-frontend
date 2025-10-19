import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { bankTransactionService, bankService, userService } from '../services';
import { BankTransaction, Bank, User } from '../types';

const BankTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredData, setFilteredData] = useState<BankTransaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [transactions, searchTerm, filterBank, filterType]);

  const loadData = async () => {
    try {
      const [transactionsData, banksData, userData] = await Promise.all([
        bankTransactionService.getAll(),
        bankService.getAll(),
        userService.getCurrentUser()
      ]);
      setTransactions(transactionsData);
      setBanks(banksData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = transactions;

    if (filterBank) {
      filtered = filtered.filter(transaction => transaction.bankId === filterBank);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setShowModal(true);
  };

  const getBankName = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    return bank ? bank.name : 'Banco não encontrado';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <h1 className="text-2xl font-bold text-secondary-900">Movimentações Bancárias</h1>
          <p className="text-secondary-600">Controle todas as transações bancárias</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Movimentação
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
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="input-field"
            >
              <option value="">Todos os bancos</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'credit' | 'debit')}
              className="input-field"
            >
              <option value="all">Todos os tipos</option>
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
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
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Créditos</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Débitos</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'debit')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Transações</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {transactions.length}
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
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-left">Banco</th>
                <th className="px-6 py-3 text-left">Descrição</th>
                <th className="px-6 py-3 text-center">Tipo</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-left">Usuário</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-secondary-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredData.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-secondary-50">
                    <td className="table-cell">{formatDate(transaction.date)}</td>
                    <td className="table-cell">{getBankName(transaction.bankId)}</td>
                    <td className="table-cell">{transaction.description}</td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                    </td>
                    <td className={`table-cell text-right font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="table-cell">{currentUser?.name || 'Usuário'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          banks={banks}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Modal para criar transação
interface TransactionModalProps {
  banks: Bank[];
  onClose: () => void;
  onSave: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ banks, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    bankId: '',
    type: 'credit' as 'credit' | 'debit',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await bankTransactionService.create({
        ...formData,
        date: new Date(formData.date),
        userId: '1' // Usar ID fixo para demonstração
      });
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar transação');
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
                Nova Movimentação Bancária
              </h3>
              
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'credit' | 'debit' })}
                    className="input-field"
                    required
                  >
                    <option value="credit">Crédito</option>
                    <option value="debit">Débito</option>
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
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
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
                Criar Movimentação
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

export default BankTransactions;
