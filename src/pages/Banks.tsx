import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import api from '../services/api';
import { Bank } from '../types';

type ContaApi = {
  idConta: number;
  agencia: string;
  conta: string;
  saldo: number;
  tipoConta: string;
  statusConta: number; // 1=ativo
  dvConta: number;
  fkBanco?: {
    idBanco: number;
    nomeBanco: string;
  };
};

type PaginatedResponse<T> = {
  content: T[];
  totalPages: number;
  number: number;
  totalElements: number;
};

const Banks: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredData, setFilteredData] = useState<Bank[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [banks, searchTerm]);

  const mapContaToBank = (c: ContaApi): Bank => ({
    id: String(c.idConta),
    name: c.fkBanco?.nomeBanco ?? 'Banco',
    code: String(c.fkBanco?.idBanco ?? ''), // exibe no “Código”
    accountNumber: `${c.conta}-${c.dvConta}`,
    agency: c.agencia,
    currentBalance: Number(c.saldo ?? 0),
    createdAt: new Date(), // backend não envia; usando fallback
    isActive: c.statusConta === 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // carrega todas as páginas de /contas e consolida
      const first = await api.get<PaginatedResponse<ContaApi>>('/contas', { params: { page: 0 } });
      const totalPages = Number(first.data.totalPages ?? 1);
      let all = first.data.content ?? [];

      if (totalPages > 1) {
        const promises = [];
        for (let p = 1; p < totalPages; p++) {
          promises.push(api.get<PaginatedResponse<ContaApi>>('/contas', { params: { page: p } }));
        }
        const pages = await Promise.all(promises);
        pages.forEach(res => {
          all = all.concat(res.data.content ?? []);
        });
      }

      const mapped = all.map(mapContaToBank);
      setBanks(mapped);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = banks.filter(b => b.isActive);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(term) ||
        b.code?.toString().includes(term) ||
        b.accountNumber?.toString().includes(term) ||
        b.agency?.toString().includes(term)
      );
    }

    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este banco?')) {
      try {
        const bank = banks.find(b => b.id === id);
        if (bank) {
          bank.isActive = false;
          filterData();
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir banco');
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR').format(date);

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
          <h1 className="text-2xl font-bold text-secondary-900">Bancos</h1>
          <p className="text-secondary-600">Contas bancárias cadastradas (Banco + Conta)</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Novo Banco
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Buscar por banco, código, agência ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Cards dos bancos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-500">Nenhuma conta encontrada</p>
          </div>
        ) : (
          filteredData.map((bank) => (
            <div key={bank.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{bank.name}</h3>
                    <p className="text-sm text-secondary-500">Código: {bank.code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(bank)}
                    className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Agência:</span>
                  <span className="text-sm font-medium text-secondary-900">{bank.agency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Conta:</span>
                  <span className="text-sm font-medium text-secondary-900">{bank.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Saldo Atual:</span>
                  <span className={`text-sm font-semibold ${bank.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(bank.currentBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Cadastrado em:</span>
                  <span className="text-sm text-secondary-900">{formatDate(bank.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal (mantido) */}
      {showModal && (
        <BankModal
          bank={editingBank}
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

// Modal para criar/editar banco
interface BankModalProps {
  bank: Bank | null;
  onClose: () => void;
  onSave: () => void;
}

const BankModal: React.FC<BankModalProps> = ({ bank, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    accountNumber: '',
    agency: '',
    currentBalance: 0
  });

  useEffect(() => {
    if (bank) {
      setFormData({
        name: bank.name,
        code: bank.code,
        accountNumber: bank.accountNumber,
        agency: bank.agency,
        currentBalance: bank.currentBalance
      });
    }
  }, [bank]);

  // helper para separar conta e DV (formato "12345-6")
  const splitAccount = (accWithDv: string) => {
    const [acc, dv] = String(accWithDv ?? '').split('-').map(s => s.trim());
    return { conta: acc || '', dvConta: Number(dv) || 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { conta, dvConta } = splitAccount(formData.accountNumber);
    const payload = {
      agencia: formData.agency,
      conta,
      dvConta,
      saldo: Number(formData.currentBalance) || 0,
      tipoConta: 'CORRENTE',
      statusConta: 1,
      fkBanco: {
        idBanco: Number(formData.code),
        nomeBanco: formData.name
      }
    };

    try {
      if (bank) {
        // atualiza a conta existente
        await api.put(`/contas/${bank.id}`, payload);
      } else {
        // cria nova conta
        await api.post('/contas', payload);
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
                {bank ? 'Editar' : 'Novo'} Banco
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Banco *
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
                    Código do Banco *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agência *
                  </label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da Conta *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                {bank ? 'Atualizar' : 'Criar'}
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

export default Banks;
