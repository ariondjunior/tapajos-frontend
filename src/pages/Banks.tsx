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
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [lastCreatedBank, setLastCreatedBank] = useState<{ id: number; nome: string } | null>(null);
  const [bankToSelect, setBankToSelect] = useState<{ id: number; nome: string } | null>(null);

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
      // carrega todas as páginas de /conta (endpoint do backend) e consolida
      const PAGE_SIZE = 100; // paginar em blocos para evitar requests gigantes
      const first = await api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: 0, size: PAGE_SIZE } });
      const totalPages = Number(first.data.totalPages ?? 1);
      let all = first.data.content ?? [];

      if (totalPages > 1) {
        const promises = [];
        for (let p = 1; p < totalPages; p++) {
          promises.push(api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: p, size: PAGE_SIZE } }));
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
    // if a bank was just created, preselect it in the account modal
    if (lastCreatedBank) {
      setBankToSelect(lastCreatedBank);
      setLastCreatedBank(null);
    } else {
      setBankToSelect(null);
    }
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setShowModal(true);
  };

const handleDelete = async (id: string) => {
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    alert('ID inválido para exclusão.');
    return;
  }

 if (window.confirm(`Tem certeza que deseja excluir o banco com ID ${id}?`)) {
  try {
    await api.delete(`/conta/${id}`, {
      params: { userId },
    });

    const bank = banks.find(b => b.id === id);
    if (bank) {
      bank.isActive = false;
      filterData();
    }

    alert('Banco excluído com sucesso!');
  } catch (error: any) {
    console.error('Erro ao excluir:', error);

    if (error.response) {
      if (error.response.status === 409) {
        alert(error.response.data || 'Não é possível excluir este banco, pois ele está vinculado a outros registros.');
      } else if (error.response.status === 500) {
        alert('Erro interno no servidor. Verifique se o banco não está vinculado a outra entidade.');
      } else {
        alert(`Erro (${error.response.status}): ${error.response.data || 'Falha desconhecida ao excluir o banco.'}`);
      }
    } else {
      alert('Erro ao conectar com o servidor. Verifique sua conexão.');
    }
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
        <div className="flex items-center gap-3">
          <button onClick={handleCreate} className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Nova Conta
          </button>
          <button
            onClick={() => setShowCreateBankModal(true)}
            className="btn-secondary flex items-center"
            title="Criar novo banco"
          >
            Novo Banco
          </button>
        </div>
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
                    <p className="text-sm text-secondary-500">ID: {bank.id} • Código: {bank.code}</p>
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
          initialSelectedBank={bankToSelect}
          onClose={() => { setShowModal(false); setBankToSelect(null); }}
          onSave={() => {
            setShowModal(false);
            setBankToSelect(null);
            loadData();
          }}
        />
      )}

      {showCreateBankModal && (
        <CreateBankModal
          onClose={() => setShowCreateBankModal(false)}
          onCreated={(b) => {
            setLastCreatedBank(b);
            setShowCreateBankModal(false);
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
  initialSelectedBank?: { id: number; nome: string } | null;
}

const BankModal: React.FC<BankModalProps> = ({ bank, onClose, onSave, initialSelectedBank }) => {
  const [formData, setFormData] = useState({
    accountNumber: '',
    agencia: '',
    conta: '',
    dvConta: '',
    currentBalance: 0
  });

  const [bankQuery, setBankQuery] = useState('');
  const [bankOptions, setBankOptions] = useState<Array<{ id: number; nome: string }>>([]);
  const [selectedBank, setSelectedBank] = useState<{ id: number; nome: string } | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [showBankList, setShowBankList] = useState(false);
  const [bankSelectedQuery, setBankSelectedQuery] = useState('');

  useEffect(() => {
    if (bank) {
      // bank.code was stored as idBanco string in mapping
      setFormData({
        accountNumber: bank.accountNumber,
        agencia: bank.agency,
        conta: (bank.accountNumber || '').split('-')[0] || '',
        dvConta: (bank.accountNumber || '').split('-')[1] || '',
        currentBalance: bank.currentBalance
      });
      setSelectedBank({ id: Number(bank.code || 0), nome: bank.name });
    }
    else if (initialSelectedBank) {
      setSelectedBank(initialSelectedBank);
      setBankQuery(initialSelectedBank.nome);
      setBankSelectedQuery(initialSelectedBank.nome);
    }
  }, [bank, initialSelectedBank]);

  // autocomplete: busca bancos por q quando dropdown aberto
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    const t = setTimeout(() => {
      if (!showBankList) return;
      const q = bankQuery.trim();
      if (bankSelectedQuery && bankSelectedQuery === q) return;
      if (q.length < 1) {
        if (mounted) setBankOptions([]);
        return;
      }

      controller = new AbortController();
      setLoadingBanks(true);
      api
        .get('/banco', { params: { q, page: 0, size: 20 }, signal: controller.signal })
        .then((res) => {
          if (!mounted) return;
          const items = res.data?.content || res.data || [];
          const list = items.map((b: any) => ({ id: b.idBanco ?? b.id, nome: b.nomeBanco ?? b.nome }));
          setBankOptions(list);
        })
        .catch(() => {
          if (!mounted) return;
          setBankOptions([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingBanks(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (controller) controller.abort();
    };
  }, [showBankList, bankQuery, bankSelectedQuery]);

  // helper para separar conta e DV (formato separado agora)
  const splitAccount = (conta: string, dv: string) => ({ conta: conta || '', dvConta: Number(dv) || 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBank) {
      alert('Selecione um banco existente antes de criar a conta.');
      return;
    }
    const { conta, dvConta } = splitAccount(formData.conta, formData.dvConta);
    const payload = {
      agencia: formData.agencia,
      conta,
      dvConta,
      saldo: Number(formData.currentBalance) || 0,
      tipoConta: 'CORRENTE',
      statusConta: 1,
      fkBanco: {
        idBanco: Number(selectedBank.id)
      }
    };

    try {
      if (bank) {
        // atualiza a conta existente
        await api.put(`/conta/${bank.id}`, payload);
      } else {
        // cria nova conta
        await api.post('/conta', payload);
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
                {bank ? 'Editar' : 'Nova'} Conta Bancária
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bankQuery || selectedBank?.nome || ''}
                      onChange={(e) => {
                        setBankQuery(e.target.value);
                        setSelectedBank(null);
                        setBankSelectedQuery('');
                      }}
                      onFocus={() => {
                        setBankSelectedQuery('');
                        setShowBankList(true);
                      }}
                      placeholder="Digite para buscar banco..."
                      className="input-field"
                      required
                    />
                    {showBankList && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingBanks ? (
                          <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                        ) : bankQuery.trim().length < 1 ? (
                          <div className="p-3 text-sm text-secondary-500">Digite para procurar bancos</div>
                        ) : bankOptions.length === 0 ? (
                          <div className="p-3 text-sm text-secondary-500">Nenhum banco encontrado</div>
                        ) : (
                          bankOptions.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setSelectedBank(b);
                                setBankQuery(b.nome);
                                setBankSelectedQuery(b.nome);
                                setShowBankList(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-secondary-50"
                            >
                              <div className="text-sm text-secondary-900">ID: {b.id} • {b.nome}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agência *</label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta *</label>
                    <input
                      type="text"
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DV *</label>
                    <input
                      type="text"
                      value={formData.dvConta}
                      onChange={(e) => setFormData({ ...formData, dvConta: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) })}
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

// Modal para criar um novo banco (separado do modal de conta)
interface CreateBankModalProps {
  onClose: () => void;
  onCreated: (b: { id: number; nome: string }) => void;
}

const CreateBankModal: React.FC<CreateBankModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const nome = name.trim();
    if (nome.length === 0) return;
    setCreating(true);
    try {
      await api.post('/banco', { nomeBanco: nome });
      // tentar localizar o banco criado
      const res = await api.get('/banco', { params: { q: nome, page: 0, size: 10 } });
      const items = res.data?.content || res.data || [];
      const found = (items.map((b: any) => ({ id: b.idBanco ?? b.id, nome: b.nomeBanco ?? b.nome })) || [])[0];
      if (found) {
        onCreated(found);
      } else {
        onCreated({ id: 0, nome });
      }
    } catch (err) {
      console.error('Erro ao criar banco:', err);
      alert('Erro ao criar banco');
    } finally {
      setCreating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Banco</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Nome do banco"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button onClick={handleCreate} disabled={creating || name.trim().length === 0} className="btn-primary w-full sm:w-auto sm:ml-3">Criar</button>
            <button onClick={onClose} className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
