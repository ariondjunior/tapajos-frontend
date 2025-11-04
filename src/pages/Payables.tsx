import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle, Eye, X } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

// Tipos da API
type ContaPagarApi = {
  idContaPagar: number;
  valorPagar: number;
  dataVencimento: string;
  dataEmissao: string;
  dataPag: string | null;
  descricaoPagar: string;
  usuario: string;
  empresa: {
    idEmpresa: number;
    razaoSocial: string;
    nomeFantasia: string;
    tipoEmpresa: number;
    cpfCnpj: string;
    tipoPessoa: number;
    email: string;
    telefone: string;
    ruaEmpresa: string;
    numeroEmpresa: number;
    bairroEmpresa: string;
    cepEmpresa: string;
    cidadeEmpresa: string;
    estadoEmpresa: string;
    paisEmpresa: string;
  };
  conta: {
    idConta: number;
    agencia: string;
    conta: string;
    saldo: number;
    tipoConta: string;
    statusConta: number;
    dvConta: number;
    fkBanco: {
      idBanco: number;
      nomeBanco: string;
    };
  };
};

type PaginatedResponse<T> = {
  content: T[];
  totalPages: number;
  number: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
};

type PayableItem = {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  issueDate: Date;
  paymentDate: Date | null;
  status: 'pending' | 'paid' | 'overdue';
  supplierName: string;
  supplierDocument: string;
  supplierId: number;
  bankName: string;
  accountInfo: string;
  accountId: number;
  user: string;
};

// Modal de visualização (somente leitura)
interface ViewModalProps {
  item: PayableItem;
  onClose: () => void;
  onEdit: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ item, onClose, onEdit }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusText = (status: string) => {
    if (status === 'overdue') return 'Vencida';
    if (status === 'paid') return 'Paga';
    return 'Pendente';
  };

  const getStatusColor = (status: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    if (status === 'paid') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            Visualizar Conta a Pagar
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">ID</label>
              <p className="text-sm font-mono text-secondary-900">#{item.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-600 mb-1">Descrição</label>
            <p className="text-sm text-secondary-900">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Valor</label>
              <p className="text-lg font-semibold text-secondary-900">{formatCurrency(item.amount)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Usuário</label>
              <p className="text-sm text-secondary-900">{item.user}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Data de Emissão</label>
              <p className="text-sm text-secondary-900">{formatDate(item.issueDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Data de Vencimento</label>
              <p className="text-sm text-secondary-900">{formatDate(item.dueDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-600 mb-1">Data de Pagamento</label>
              <p className="text-sm text-secondary-900">
                {item.paymentDate ? formatDate(item.paymentDate) : '-'}
              </p>
            </div>
          </div>

          <div className="bg-secondary-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-secondary-900">Informações do Fornecedor</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1">Nome</label>
                <p className="text-sm text-secondary-900">{item.supplierName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1">Documento</label>
                <p className="text-sm text-secondary-900">{item.supplierDocument}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-secondary-900">Informações Bancárias</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1">Banco</label>
                <p className="text-sm text-secondary-900">{item.bankName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1">Conta</label>
                <p className="text-sm text-secondary-900">{item.accountInfo}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              Fechar
            </button>
            <button
              onClick={onEdit}
              className="btn-primary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de criação/edição
interface EditModalProps {
  item: PayableItem | null;
  onClose: () => void;
  onSave: () => void;
  suppliers: Array<{ id: number; name: string }>;
  accounts: Array<{ id: number; name: string }>;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave, suppliers, accounts }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    dueDate: '',
    issueDate: '',
    paymentDate: '',
    supplierId: 0,
    accountId: 0,
    user: 'system',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      // Tentar extrair IDs das informações do item
      // Você pode precisar ajustar isso dependendo de como os dados vêm da API
      setFormData({
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate.toISOString().split('T')[0],
        issueDate: item.issueDate.toISOString().split('T')[0],
        paymentDate: item.paymentDate ? item.paymentDate.toISOString().split('T')[0] : '',
        supplierId: 0, // Será preenchido com os dados completos da API
        accountId: 0, // Será preenchido com os dados completos da API
        user: item.user,
      });
    }
  }, [item]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Data de vencimento é obrigatória';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Data de emissão é obrigatória';
    }
    if (formData.supplierId === 0) {
      newErrors.supplierId = 'Selecione um fornecedor';
    }
    if (formData.accountId === 0) {
      newErrors.accountId = 'Selecione uma conta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateTimeForBackend = (dateString: string): string | null => {
    if (!dateString) return null;
    return `${dateString}T12:00:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    // Payload completo tanto para POST quanto para PUT
    const payload = {
      descricaoPagar: formData.description,
      valorPagar: formData.amount,
      dataVencimento: formatDateTimeForBackend(formData.dueDate),
      dataEmissao: formatDateTimeForBackend(formData.issueDate),
      dataPag: formatDateTimeForBackend(formData.paymentDate),
      usuario: formData.user,
      empresa: { idEmpresa: formData.supplierId },
      conta: { idConta: formData.accountId }
    };

    try {
      if (item) {
        // PUT - Atualizar
        await api.put(`/pagar/${item.id}`, payload);
        alert('Conta a pagar atualizada com sucesso!');
      } else {
        // POST - Criar
        await api.post('/pagar', payload);
        alert('Conta a pagar criada com sucesso!');
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data || 'Erro ao salvar conta a pagar';
        console.error('Resposta do servidor:', error.response?.data);
        alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      } else {
        alert('Erro ao salvar conta a pagar');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            {item ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              disabled={submitting}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Fornecedor *
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
              className={`input-field ${errors.supplierId ? 'border-red-500' : ''}`}
              disabled={submitting}
            >
              <option value={0}>Selecione um fornecedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>
            )}
            {item && (
              <p className="text-xs text-secondary-500 mt-1">
                Fornecedor atual não pode ser alterado. Selecione o mesmo fornecedor.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Conta Bancária *
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: Number(e.target.value) })}
              className={`input-field ${errors.accountId ? 'border-red-500' : ''}`}
              disabled={submitting}
            >
              <option value={0}>Selecione uma conta</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-red-500 text-xs mt-1">{errors.accountId}</p>
            )}
            {item && (
              <p className="text-xs text-secondary-500 mt-1">
                Conta bancária atual não pode ser alterada. Selecione a mesma conta.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className={`input-field ${errors.amount ? 'border-red-500' : ''}`}
                disabled={submitting}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`input-field ${errors.dueDate ? 'border-red-500' : ''}`}
                disabled={submitting}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data de Emissão *
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`input-field ${errors.issueDate ? 'border-red-500' : ''}`}
                disabled={submitting}
              />
              {errors.issueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.issueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="input-field"
                disabled={submitting}
              />
              <p className="text-xs text-secondary-500 mt-1">
                Deixe vazio se ainda não foi pago
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : (item ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Payables: React.FC = () => {
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [filteredData, setFilteredData] = useState<PayableItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PayableItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: number; name: string }>>([]);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Agora é state
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Buscar fornecedores (usar /empresa)
  const loadSuppliers = async () => {
    try {
      const res = await api.get('/empresa', { params: { page: 0, pageSize: 50 } });
      const empresas = res.data?.content || res.data || [];
      const fornecedores = empresas.filter((e: any) => e.tipoEmpresa === 1);
      setSuppliers(
        fornecedores.map((e: any) => ({
          id: e.idEmpresa,
          name: e.nomeFantasia || e.razaoSocial,
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar fornecedores (/empresa):', error);
    }
  };

  // Buscar contas bancárias (usar /conta)
  const loadAccounts = async () => {
    try {
      const res = await api.get('/conta', { params: { page: 0, pageSize: 100 } });
      const contas = res.data?.content || res.data || [];
      setAccounts(
        contas.map((c: any) => ({
          id: c.idConta,
          name: `${c.fkBanco?.nomeBanco || 'Banco'} - Ag ${c.agencia} Cc ${c.conta}-${c.dvConta}`,
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar contas (/conta):', error);
    }
  };

  // Evitar requisição no mount: só quando o modal abrir
  useEffect(() => {
    if (showEditModal) {
      if (suppliers.length === 0) loadSuppliers();
      if (accounts.length === 0) loadAccounts();
    }
  }, [showEditModal]);

  // Removido o useEffect inicial que carregava automaticamente
  // useEffect(() => {
  //   handleSearch(0);
  // }, []);

  const mapContaPagarToPayable = (c: ContaPagarApi): PayableItem => {
    console.log('Mapeando conta a pagar:', c);
    
    const dueDate = new Date(c.dataVencimento);
    const today = new Date();
    const isPaid = c.dataPag !== null;
    const isOverdue = !isPaid && dueDate < today;

    // Verificar se empresa e conta existem
    if (!c.empresa) {
      console.warn('Conta sem empresa:', c);
    }
    if (!c.conta) {
      console.warn('Conta sem conta bancária:', c);
    }

    return {
      id: String(c.idContaPagar),
      description: c.descricaoPagar || 'Sem descrição',
      amount: c.valorPagar || 0,
      dueDate: new Date(c.dataVencimento),
      issueDate: new Date(c.dataEmissao),
      paymentDate: c.dataPag ? new Date(c.dataPag) : null,
      status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
      supplierName: c.empresa?.nomeFantasia || 'Fornecedor não informado',
      supplierDocument: c.empresa?.cpfCnpj || '-',
      supplierId: c.empresa?.idEmpresa || 0,
      bankName: c.conta?.fkBanco?.nomeBanco || 'Banco não informado',
      accountInfo: c.conta 
        ? `Ag ${c.conta.agencia} Cc ${c.conta.conta}-${c.conta.dvConta}` 
        : 'Conta não informada',
      accountId: c.conta?.idConta || 0,
      user: c.usuario || 'Sistema',
    };
  };

  const handleSearch = async (page: number = 0, size: number = pageSize) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get<PaginatedResponse<ContaPagarApi>>('/pagar', {
        params: {
          page,
          pageSize: size,
        }
      });

      console.log('Resposta completa de /pagar:', res.data);
      console.log('Primeiro item (se existir):', res.data.content?.[0]);

      const contas = res.data.content || [];
      
      if (contas.length === 0) {
        console.warn('Nenhuma conta retornada da API');
      }

      const mapped = contas.map(mapContaPagarToPayable);
      console.log('Contas mapeadas:', mapped);

      setPayables(mapped);
      setCurrentPage(res.data.number);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
      
      filterData(mapped);
    } catch (err) {
      console.error('Erro ao buscar contas a pagar:', err);
      if (axios.isAxiosError(err)) {
        console.error('Detalhes da resposta:', err.response?.data);
        console.error('Status:', err.response?.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterData = (data: PayableItem[] = payables) => {
    let filtered = data;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(term) ||
        item.supplierName.toLowerCase().includes(term) ||
        item.supplierDocument.includes(term)
      );
    }

    filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    setFilteredData(filtered);
  };

  const handleSearchClick = () => {
    handleSearch(0, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (hasSearched) {
      handleSearch(0, newSize); // Reinicia na página 0 com novo tamanho
    }
  };

  const handleView = (item: PayableItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: PayableItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      try {
        await api.delete(`/pagar/${id}`);
        handleSearch(currentPage);
        alert('Conta a pagar excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir conta a pagar');
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      handleSearch(currentPage - 1, pageSize);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      handleSearch(currentPage + 1, pageSize);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(page, pageSize);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'overdue') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'paid') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'overdue') return 'Vencida';
    if (status === 'paid') return 'Paga';
    return 'Pendente';
  };

  const getStatusColor = (status: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    if (status === 'paid') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Contas a Pagar</h1>
          <p className="text-secondary-600">Gerencie as duplicatas de fornecedores</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Nova Conta a Pagar
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencida</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="input-field"
              title="Itens por página"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              onClick={handleSearchClick}
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mostra loading durante pesquisa */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Mostra mensagem se não pesquisou ainda */}
      {!hasSearched && !loading && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-secondary-300 mb-4" />
            <p className="text-secondary-500 text-lg">Clique em "Pesquisar" para visualizar as contas a pagar</p>
            <p className="text-secondary-400 text-sm mt-2">Você pode escolher quantos itens deseja ver por página</p>
          </div>
        </div>
      )}

      {/* Resumo - só aparece após pesquisa */}
      {hasSearched && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total a Pagar</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {formatCurrency(
                      payables.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)
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
                    {payables.filter(p => p.status === 'pending').length}
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
                  <p className="text-sm font-medium text-secondary-600">Pagas</p>
                  <p className="text-2xl font-semibold text-secondary-900">
                    {payables.filter(p => p.status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela - só aparece após pesquisa */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead>
                  <tr className="bg-secondary-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Banco/Conta
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-secondary-500">
                        Nenhuma conta a pagar encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-secondary-600">#{item.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-secondary-900">{item.supplierName}</div>
                          <div className="text-sm text-secondary-500">{item.supplierDocument}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-secondary-900">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-secondary-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">{formatDate(item.dueDate)}</div>
                          {item.paymentDate && (
                            <div className="text-xs text-secondary-500">Pago: {formatDate(item.paymentDate)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">{item.bankName}</div>
                          <div className="text-xs text-secondary-500">{item.accountInfo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {getStatusIcon(item.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleView(item)}
                              className="p-2 text-secondary-400 hover:text-blue-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
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

            {/* Paginação - só aparece se houver dados */}
            {filteredData.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-secondary-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-secondary-700">
                      Mostrando <span className="font-medium">{currentPage * pageSize + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min((currentPage + 1) * pageSize, totalElements)}
                      </span>{' '}
                      de <span className="font-medium">{totalElements}</span> resultados
                    </p>
                  </div>
                  
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {getPageNumbers().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50'
                          }`}
                        >
                          {page + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próxima</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedItem && (
        <ViewModal
          item={selectedItem}
          onClose={() => {
            setShowViewModal(false);
            setSelectedItem(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {/* Modal de Edição/Criação */}
      {showEditModal && (
        <EditModal
          item={selectedItem}
          suppliers={suppliers}
          accounts={accounts}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            handleSearch(currentPage, pageSize);
          }}
        />
      )}
    </div>
  );
};

export default Payables;