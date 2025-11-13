import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

type ContaReceberApi = {
  idReceber: number;
  valorReceber: number;
  dataVencimento: string;
  dataEmissao: string;
  dataRec: string | null;
  descricaoReceber: string;
  formaPagamento: string;
  usuario: string;
  empresa: {
    idEmpresa: number;
    nomeFantasia: string;
    cpfCnpj: string;
  };
  conta: {
    idConta: number;
    agencia: string;
    conta: string;
    dvConta: number | string;
    fkBanco: { nomeBanco: string };
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

type ReceivableItem = {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  issueDate: Date;
  paymentDate: Date | null;
  status: 'pending' | 'paid' | 'overdue';
  clientName: string;
  clientDocument: string;
  clientId: number;
  bankName: string;
  accountInfo: string;
  accountId: number;
  paymentMethod: string;
  user: string;
};

type CompanyOption = { id: number; name: string };
type BankAccount = {
  idConta: number;
  agencia: string;
  conta: string;
  dvConta: string | number;
  fkBanco?: { nomeBanco?: string };
};

const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [filteredData, setFilteredData] = useState<ReceivableItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<ReceivableItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [companies, setCompanies] = useState<Array<{ id: number; name: string; tipoEmpresa?: number }>>([]);
  const [companyFilterType, setCompanyFilterType] = useState<'all' | 'cliente' | 'fornecedor'>('all');
  const [emissaoStart, setEmissaoStart] = useState<string>('');
  const [vencimentoEnd, setVencimentoEnd] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  

  const mapContaReceberToReceivable = (c: ContaReceberApi): ReceivableItem => {
    const dueDate = new Date(c.dataVencimento);
    const issueDate = new Date(c.dataEmissao);
    const paymentDate = c.dataRec ? new Date(c.dataRec) : null;

    const today = stripTime(new Date());
    const dueOnly = stripTime(dueDate);

    const isPaid = !!paymentDate;
    const isOverdue = !isPaid && dueOnly < today;

    return {
      id: String(c.idReceber),
      description: c.descricaoReceber || 'Sem descrição',
      amount: c.valorReceber || 0,
      dueDate,
      issueDate,
      paymentDate,
      status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
      clientName: c.empresa?.nomeFantasia || 'Cliente não informado',
      clientDocument: c.empresa?.cpfCnpj || '-',
      clientId: c.empresa?.idEmpresa || 0,
      bankName: c.conta?.fkBanco?.nomeBanco || 'Banco não informado',
      accountInfo: c.conta
        ? `Ag ${c.conta.agencia} Cc ${c.conta.conta}-${c.conta.dvConta}`
        : 'Conta não informada',
      accountId: c.conta?.idConta || 0,
      paymentMethod: c.formaPagamento || '-',
      user: c.usuario || 'Sistema',
    };
  };

  const handleSearch = async (page: number = 0, size: number = pageSize) => {
    setLoading(true);
    setHasSearched(true);
    setErrorMsg(null);
    try {
      const res = await api.get<PaginatedResponse<ContaReceberApi>>('/receber', {
        params: { page, size },
      });

      console.log('GET /receber =>', res.data);
      const contas = res.data?.content || [];
      const mapped = contas.map(mapContaReceberToReceivable);

  setReceivables(mapped);
  setFilteredData(applyFilters(mapped, searchTerm, filterStatus, companyFilterType, companies));

      setCurrentPage(res.data.number);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      console.error('Erro ao buscar contas a receber:', err);
      if (axios.isAxiosError(err)) {
        const serverMsg =
          typeof err.response?.data === 'string'
            ? err.response?.data
            : err.response?.data?.message || 'Falha ao carregar /receber';
        setErrorMsg(serverMsg);
      } else {
        setErrorMsg('Falha ao carregar /receber');
      }
      setReceivables([]);
      setFilteredData([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get('/empresa', { params: { page: 0, pageSize: 200 } });
      const empresas = res.data?.content || res.data || [];
      setCompanies(
        empresas.map((e: any) => ({ id: e.idEmpresa ?? e.id, name: e.nomeFantasia || e.razaoSocial || e.nome, tipoEmpresa: e.tipoEmpresa }))
      );
    } catch (err) {
      console.error('Erro ao carregar empresas para filtro:', err);
    }
  };

  const handleLoadPeriod = async () => {
    if (!emissaoStart || !vencimentoEnd) return alert('Escolha data de emissão e vencimento para o período');

    const startDate = new Date(emissaoStart);
    const endDate = new Date(vencimentoEnd);
    if (endDate.getTime() < startDate.getTime()) {
      return alert('A data final deve ser igual ou posterior à data inicial');
    }

    setLoading(true);
    try {
      const res = await api.get<any[]>('/receber/periodo', { params: { emissao: emissaoStart, vencimento: vencimentoEnd } });
      const contas = res.data || res || [];
      const mapped = contas.map((c: ContaReceberApi) => mapContaReceberToReceivable(c));
      setReceivables(mapped);
      setCurrentPage(0);
      setTotalPages(1);
      setTotalElements(mapped.length);
      setHasSearched(true);
      setFilteredData(applyFilters(mapped, searchTerm, filterStatus, companyFilterType, companies));
    } catch (err) {
      console.error('Erro ao carregar faturas por período:', err);
      alert('Erro ao carregar por período');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchOrPeriod = async () => {
    if (emissaoStart && vencimentoEnd) {
      await handleLoadPeriod();
    } else {
      await handleSearch(0, pageSize);
    }
  };

  const applyFilters = (
    data: ReceivableItem[],
    term: string,
    status: 'all' | 'pending' | 'paid' | 'overdue',
    companyType: 'all' | 'cliente' | 'fornecedor' = 'all',
    companiesList: Array<{ id: number; name: string; tipoEmpresa?: number }> = []
  ) => {
    let out = [...data];

    if (status !== 'all') out = out.filter((i) => i.status === status);

    if (term.trim()) {
      const q = term.toLowerCase();
      out = out.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q) ||
          i.clientDocument.toLowerCase().includes(q)
      );
    }

    if (companyType !== 'all') {
      out = out.filter((item) => {
        const comp = companiesList.find((c) => Number(c.id) === Number(item.clientId));
        if (!comp) return false;
        if (companyType === 'cliente') return Number(comp.tipoEmpresa) === 0;
        if (companyType === 'fornecedor') return Number(comp.tipoEmpresa) === 1;
        return true;
      });
    }

    out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return out;
  };

  useEffect(() => {
    if (!hasSearched) return;
    setFilteredData(applyFilters(receivables, searchTerm, filterStatus, companyFilterType, companies));
  }, [searchTerm, filterStatus, receivables, companyFilterType, companies]);

  useEffect(() => {
    if (companies.length === 0) loadCompanies();
  }, []);

  const handleSearchClick = () => handleSearch(0, pageSize);

  const handleEdit = (item: ReceivableItem) => {
    setEditing(item);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta a receber?')) return;
    try {
      await api.delete(`/receber/${id}`);
      alert('Conta a receber excluída com sucesso!');
      handleSearch(currentPage, pageSize);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || error.response?.data || 'Erro ao excluir';
        alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } else {
        alert('Erro ao excluir conta a receber');
      }
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (hasSearched) handleSearch(0, newSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    handleSearch(newPage, pageSize);
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
    if (status === 'paid') return 'Recebida';
    return 'Pendente';
  };

  const getStatusColor = (status: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800';
    if (status === 'paid') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(date);

  const totalPending = receivables
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const countPending = receivables.filter((r) => r.status === 'pending').length;
  const countPaid = receivables.filter((r) => r.status === 'paid').length;

  return (
    <div className="space-y-6">
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

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, cliente ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
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
              <option value="paid">Recebida</option>
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
              onClick={handleSearchOrPeriod}
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
              aria-label="Pesquisar"
              title="Pesquisar"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
          <div className="md:col-span-3">
            <label className="text-sm text-secondary-600">Emissão</label>
            <input type="date" value={emissaoStart} onChange={(e) => setEmissaoStart(e.target.value)} className="input-field" />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-secondary-600">Vencimento</label>
            <input type="date" value={vencimentoEnd} onChange={(e) => setVencimentoEnd(e.target.value)} className="input-field" />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm text-secondary-600">Tipo de Empresa</label>
            <select value={companyFilterType} onChange={(e) => setCompanyFilterType(e.target.value as any)} className="input-field">
              <option value="all">Todos</option>
              <option value="cliente">Cliente</option>
              <option value="fornecedor">Fornecedor</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {errorMsg}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-secondary-300 mb-4" />
            <p className="text-secondary-500 text-lg">Clique em "Pesquisar" para visualizar as contas a receber</p>
            <p className="text-secondary-400 text-sm mt-2">Você pode escolher quantos itens deseja ver por página</p>
          </div>
        </div>
      )}

      {hasSearched && !loading && (
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
                  {formatCurrency(totalPending)}
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
                <p className="text-2xl font-semibold text-secondary-900">{countPending}</p>
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
                <p className="text-2xl font-semibold text-secondary-900">{countPaid}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr className="bg-secondary-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Cliente
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
                      Nenhuma conta a receber encontrada
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-secondary-600">#{item.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">{item.clientName}</div>
                        <div className="text-sm text-secondary-500">{item.clientDocument}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-secondary-900">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-secondary-900">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">{formatDate(item.dueDate)}</div>
                        {item.paymentDate && (
                          <div className="text-xs text-secondary-500">Recebido: {formatDate(item.paymentDate)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">{item.bankName}</div>
                        <div className="text-xs text-secondary-500">{item.accountInfo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          {getStatusIcon(item.status)}
                          <span
                            className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-secondary-700">
                Mostrando {currentPage * pageSize + 1} até {Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements} resultados
              </div>
              <div className="flex space-x-2">
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
          )}
        </div>
      )}

      <EditReceivableModal
        open={showEditModal}
        item={editing}
        onClose={() => {
          setShowEditModal(false);
          setEditing(null);
        }}
        onSaved={() => {
          setShowEditModal(false);
          setEditing(null);
          handleSearch(currentPage, pageSize);
        }}
      />

      <CreateReceivableModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSaved={() => {
          setShowCreateModal(false);
          handleSearch(currentPage, pageSize);
        }}
      />
    </div>
  );
};

const CreateReceivableModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: authUser } = useAuth();

  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [companySelectedQuery, setCompanySelectedQuery] = useState('');

  const [accountQuery, setAccountQuery] = useState('');
  const [accountOptions, setAccountOptions] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [accountSelectedQuery, setAccountSelectedQuery] = useState('');

  const [form, setForm] = useState({
    descricaoReceber: '',
    valorReceber: '',
    formaPagamento: '',
    usuario: '',
    dataEmissao: '',
    dataVencimento: '',
    dataRec: '',
  });

  const inputToDateTime = (s: string) => (s ? `${s}T12:00:00` : null);

  useEffect(() => {
    if (!open) return;

    setForm({
      descricaoReceber: '',
      valorReceber: '',
      formaPagamento: '',
      usuario: authUser?.name || '',
      dataEmissao: '',
      dataVencimento: '',
      dataRec: '',
    });
    setSelectedCompany(null);
    setCompanyQuery('');
    setCompanyOptions([]);
    setShowCompanyList(false);
    setCompanySelectedQuery('');

    setSelectedAccount(null);
    setAccountQuery('');
    setAccountOptions([]);
    setShowAccountList(false);
    setAccountSelectedQuery('');

    setError(null);
  }, [open]);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    const t = setTimeout(() => {
      if (!open || !showCompanyList) return;
      const q = companyQuery.trim();
      if (companySelectedQuery && companySelectedQuery === q) return;
      if (q.length < 2) {
        if (mounted) setCompanyOptions([]);
        return;
      }

      controller = new AbortController();
      setLoadingCompanies(true);

      api
        .get('/empresa', { params: { q }, signal: controller.signal })
        .then((res) => {
          if (!mounted) return;
          const data = res.data?.content || res.data || [];
          const qLower = q.toLowerCase();
          const matched = (data as any[]).filter((e: any) => {
            const a = String(e.nomeFantasia ?? '').toLowerCase();
            const b = String(e.razaoSocial ?? '').toLowerCase();
            const c = String(e.nome ?? '').toLowerCase();
            const doc = String(e.cpfCnpj ?? e.cnpj ?? '').toLowerCase();
            return (
              (a && a.includes(qLower)) ||
              (b && b.includes(qLower)) ||
              (c && c.includes(qLower)) ||
              (doc && doc.includes(qLower))
            );
          });
          const list: CompanyOption[] = matched
            .map((e: any) => ({ id: e.idEmpresa ?? e.id, name: e.nomeFantasia ?? e.razaoSocial ?? e.nome }))
            .filter((e: any) => e.id && e.name);
          setCompanyOptions(list);
          setShowCompanyList(true);
        })
        .catch(() => {
          if (!mounted) return;
          setCompanyOptions([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingCompanies(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (controller) controller.abort();
    };
  }, [open, companyQuery, companySelectedQuery, showCompanyList]);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    const t = setTimeout(() => {
      if (!open || !showAccountList) return;
      const q = accountQuery.trim();
      if (accountSelectedQuery && accountSelectedQuery === q) return;
      if (q.length < 2) {
        if (mounted) setAccountOptions([]);
        return;
      }

      controller = new AbortController();
      setLoadingAccounts(true);

      api
        .get('/conta', { params: { q, page: 0, size: 20 }, signal: controller.signal })
        .then((res) => {
          if (!mounted) return;
          const data = res.data?.content || res.data || [];
          const list: BankAccount[] = data
            .map((c: any) => ({
              idConta: c.idConta ?? c.id,
              agencia: String(c.agencia ?? ''),
              conta: String(c.conta ?? ''),
              dvConta: c.dvConta ?? '',
              fkBanco: { nomeBanco: c.fkBanco?.nomeBanco ?? c.banco?.nome },
            }))
            .filter((c: any) => !!c.idConta);
          setAccountOptions(list);
          setShowAccountList(true);
        })
        .catch(() => {
          if (!mounted) return;
          setAccountOptions([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingAccounts(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (controller) controller.abort();
    };
  }, [open, accountQuery, accountSelectedQuery, showAccountList]);

  const submitCreate = async () => {
    const empresaId = selectedCompany?.id;
    const contaId = selectedAccount?.idConta;

    const usuarioValue = (authUser?.name || form.usuario || '').trim();

    if (!empresaId) return setError('Selecione a empresa (cliente)');
    if (!contaId) return setError('Selecione a conta bancária');
    if (!form.descricaoReceber.trim()) return setError('Informe a descrição');
    if (!form.formaPagamento) return setError('Informe a forma de pagamento');
    if (!form.dataEmissao) return setError('Informe a data de emissão');
    if (!form.dataVencimento) return setError('Informe a data de vencimento');
    if (!usuarioValue) return setError('Informe o usuário');
    if (!form.valorReceber || Number(form.valorReceber) <= 0) return setError('Informe um valor válido');

    const emisDate = new Date(form.dataEmissao);
    const vencDate = new Date(form.dataVencimento);
    if (emisDate.getTime() > vencDate.getTime()) {
      return setError('A data de emissão não pode ser posterior à data de vencimento');
    }
    if (form.dataRec) {
      const recDate = new Date(form.dataRec);
      if (recDate.getTime() < emisDate.getTime()) {
        return setError('A data de recebimento não pode ser anterior à data de emissão');
      }
    }

    const payload = {
      valorReceber: Number(form.valorReceber),
      dataVencimento: inputToDateTime(form.dataVencimento),
      dataEmissao: inputToDateTime(form.dataEmissao),
      dataRec: form.dataRec ? inputToDateTime(form.dataRec) : null,
      descricaoReceber: form.descricaoReceber,
      formaPagamento: form.formaPagamento,
      usuario: usuarioValue,
      empresa: { idEmpresa: Number(empresaId) },
      conta: { idConta: Number(contaId) },
    };

    try {
      setSubmitting(true);
      setError(null);
      console.debug('POST /receber', payload);
      await api.post('/receber', payload);
      alert('Conta a receber criada com sucesso!');
      onSaved();
    } catch (err: any) {
      console.error('Erro no POST /receber:', err?.response || err);
      const data = err?.response?.data;
      setError(typeof data === 'string' ? data : data?.message || 'Falha ao criar conta a receber');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    submitCreate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Criar Nova Conta a Receber</h2>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Empresa (Cliente) *</label>
            <div className="relative">
              <input
                type="text"
                value={companyQuery}
                onChange={(e) => {
                  setCompanyQuery(e.target.value);
                  setSelectedCompany(null);
                  setCompanySelectedQuery('');
                }}
                onFocus={() => {
                  setCompanySelectedQuery('');
                  setShowCompanyList(true);
                }}
                placeholder="Digite para buscar a empresa..."
                className="input-field"
              />
              {showCompanyList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingCompanies ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : companyQuery.trim().length < 2 ? (
                    <div className="p-3 text-sm text-secondary-500">Digite pelo menos 2 caracteres</div>
                  ) : companyOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">Nenhuma empresa encontrada</div>
                  ) : (
                    companyOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setSelectedCompany(opt);
                          setCompanyQuery(opt.name);
                          setCompanySelectedQuery(opt.name);
                          setShowCompanyList(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-secondary-50"
                      >
                        <div className="text-sm text-secondary-900">ID: {opt.id} • {opt.name}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedCompany && (
                <div className="text-xs text-secondary-600 mt-1">Selecionada: ID {selectedCompany.id} • {selectedCompany.name}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Conta Bancária *</label>
            <div className="relative">
              <input
                type="text"
                value={accountQuery}
                onChange={(e) => {
                  setAccountQuery(e.target.value);
                  setSelectedAccount(null);
                  setAccountSelectedQuery('');
                }}
                onFocus={() => {
                  setAccountSelectedQuery('');
                  setShowAccountList(true);
                }}
                placeholder="Digite para buscar (banco, agência ou conta)..."
                className="input-field"
              />
              {showAccountList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingAccounts ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : accountOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">
                      {accountQuery.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhuma conta encontrada'}
                    </div>
                  ) : (
                    accountOptions.map((acc) => (
                      <button
                        type="button"
                        key={acc.idConta}
                        onClick={() => {
                          const label = `${acc.fkBanco?.nomeBanco || 'Banco'} • Ag ${acc.agencia} • Cc ${acc.conta}-${acc.dvConta}`;
                          setSelectedAccount(acc);
                          setAccountQuery(label);
                          setAccountSelectedQuery(label);
                          setShowAccountList(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-secondary-50"
                      >
                        <div className="text-sm text-secondary-900">
                          ID: {acc.idConta} • {acc.fkBanco?.nomeBanco || 'Banco'} • Ag {acc.agencia} • Cc {acc.conta}-{acc.dvConta}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedAccount && (
                <div className="mt-2 rounded-md border bg-secondary-50 p-3">
                  <div className="text-sm font-semibold mb-1">Resumo da conta selecionada</div>
                  <div className="text-sm text-secondary-900">ID: {selectedAccount.idConta}</div>
                  <div className="text-sm text-secondary-900">
                    Banco: {selectedAccount.fkBanco?.nomeBanco ?? '-'}
                  </div>
                  <div className="text-sm text-secondary-900">
                    Agência: {selectedAccount.agencia} • Conta: {selectedAccount.conta}-{selectedAccount.dvConta}
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" className="px-3 py-1 border rounded-md text-sm" onClick={() => setSelectedAccount(null)}>
                      Limpar
                    </button>
                  </div>
                </div>
              )}
              {selectedAccount && (
                <div className="text-xs text-secondary-600 mt-1">
                  Selecionada: ID {selectedAccount.idConta}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricaoReceber}
                onChange={(e) => setForm({ ...form, descricaoReceber: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de Pagamento *</label>
              <select
                value={form.formaPagamento}
                onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                className="input-field"
              >
                <option value="">Selecione</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="BOLETO">Boleto</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="PIX">PIX</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Emissão *</label>
              <input
                type="date"
                value={form.dataEmissao}
                onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Vencimento *</label>
              <input
                type="date"
                value={form.dataVencimento}
                onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Recebimento</label>
              <input
                type="date"
                value={form.dataRec}
                onChange={(e) => setForm({ ...form, dataRec: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor *</label>
              <input
                type="number"
                step="0.01"
                value={form.valorReceber}
                onChange={(e) => setForm({ ...form, valorReceber: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário *</label>
                <input
                  type="text"
                  value={form.usuario || ''}
                  readOnly
                  className="input-field bg-gray-50 cursor-not-allowed"
                />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 border rounded-md" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={submitting}
              onClick={submitCreate}
            >
              {submitting ? 'Criando...' : 'Criar Conta a Receber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditReceivableModal: React.FC<{
  open: boolean;
  item: ReceivableItem | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, item, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: authUser } = useAuth();

  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanyList, setShowCompanyList] = useState(false);

  const [accountQuery, setAccountQuery] = useState('');
  const [accountOptions, setAccountOptions] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [accountPreview, setAccountPreview] = useState<BankAccount | null>(null);

  const [form, setForm] = useState({
    descricaoReceber: '',
    valorReceber: '',
    formaPagamento: '',
    usuario: '',
    dataEmissao: '',
    dataVencimento: '',
    dataRec: '',
  });

  const dateToInput = (d?: Date | null) => {
    if (!d) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const inputToDateTime = (s: string) => (s ? `${s}T12:00:00` : null);
  const getEmpresaId = () => (selectedCompany?.id ?? item?.clientId ?? null);
  const getContaId = () => (selectedAccount?.idConta ?? item?.accountId ?? null);

  const submitEdit = async () => {
    if (!item) return;

    const empresaId = getEmpresaId();
    const contaId = getContaId();

    console.debug('[submitEdit] Iniciando update para id:', item.id);

    const usuarioValue = (authUser?.name || form.usuario || '').trim();

    if (!empresaId) return setError('Selecione a empresa');
    if (!contaId) return setError('Selecione a conta bancária');
    if (!form.descricaoReceber.trim()) return setError('Informe a descrição');
    if (!form.formaPagamento) return setError('Informe a forma de pagamento');
    if (!form.dataEmissao) return setError('Informe a data de emissão');
    if (!form.dataVencimento) return setError('Informe a data de vencimento');
    if (!usuarioValue) return setError('Informe o usuário');
    if (!form.valorReceber || Number(form.valorReceber) <= 0) return setError('Informe um valor válido');

    const emisDate = new Date(form.dataEmissao);
    const vencDate = new Date(form.dataVencimento);
    if (emisDate.getTime() > vencDate.getTime()) {
      return setError('A data de emissão não pode ser posterior à data de vencimento');
    }
    if (form.dataRec) {
      const recDate = new Date(form.dataRec);
      if (recDate.getTime() < emisDate.getTime()) {
        return setError('A data de recebimento não pode ser anterior à data de emissão');
      }
    }

    const url = `/receber/${Number(item.id)}`;
    const payload = {
      idReceber: Number(item.id),
      valorReceber: Number(form.valorReceber),
      dataVencimento: inputToDateTime(form.dataVencimento),
      dataEmissao: inputToDateTime(form.dataEmissao),
      dataRec: form.dataRec ? inputToDateTime(form.dataRec) : null,
      descricaoReceber: form.descricaoReceber,
      formaPagamento: form.formaPagamento,
      usuario: usuarioValue,
      empresa: { idEmpresa: Number(empresaId) },
      conta: { idConta: Number(contaId) },
    };

    try {
      setSubmitting(true);
      setError(null);
      console.debug('PUT', url, payload);
      await api.put(url, payload);
      alert('Conta a receber atualizada com sucesso!');
      onSaved();
    } catch (err: any) {
      console.error('Erro no PUT /receber:', err?.response || err);
      const data = err?.response?.data;
      setError(typeof data === 'string' ? data : data?.message || 'Falha ao atualizar conta a receber');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    submitEdit();
  };

  useEffect(() => {
    if (!open || !item) return;

    setForm({
      descricaoReceber: item.description || '',
      valorReceber: String(item.amount ?? ''),
      formaPagamento: item.paymentMethod || '',
      usuario: authUser?.name || item.user || '',
      dataEmissao: dateToInput(item.issueDate),
      dataVencimento: dateToInput(item.dueDate),
      dataRec: item.paymentDate ? dateToInput(item.paymentDate) : '',
    });

    setSelectedCompany(
      item.clientId
        ? { id: item.clientId, name: item.clientName }
        : null
    );
    setCompanyQuery(item.clientName || '');
    setCompanyOptions([]);
    setShowCompanyList(false);

    setSelectedAccount(
      item.accountId
        ? {
            idConta: item.accountId,
            agencia: (item.accountInfo.split('Ag ')[1] || '').split(' ')[0] || '',
            conta: (item.accountInfo.split('Cc ')[1] || '').split('-')[0] || '',
            dvConta: (item.accountInfo.split('-')[1] || '').trim(),
            fkBanco: { nomeBanco: item.bankName },
          }
        : null
    );
    setAccountQuery(item.bankName ? `${item.bankName} • ${item.accountInfo}` : '');
    setAccountOptions([]);
    setShowAccountList(false);
    setAccountPreview(null);

    setError(null);
  }, [open, item]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!open) return;
      const q = companyQuery.trim();
      if (q.length < 2) {
        setCompanyOptions([]);
        return;
      }
      try {
        setLoadingCompanies(true);
        const res = await api.get('/empresa', { params: { q } });
        const data = res.data?.content || res.data || [];
        const qLower = q.toLowerCase();
        const matched = (data as any[]).filter((e: any) => {
          const a = String(e.nomeFantasia ?? '').toLowerCase();
          const b = String(e.razaoSocial ?? '').toLowerCase();
          const c = String(e.nome ?? '').toLowerCase();
          const doc = String(e.cpfCnpj ?? e.cnpj ?? '').toLowerCase();
          return (
            (a && a.includes(qLower)) ||
            (b && b.includes(qLower)) ||
            (c && c.includes(qLower)) ||
            (doc && doc.includes(qLower))
          );
        });
        const list: CompanyOption[] = matched
          .map((e: any) => ({ id: e.idEmpresa ?? e.id, name: e.nomeFantasia ?? e.razaoSocial ?? e.nome }))
          .filter((e: any) => e.id && e.name);
        setCompanyOptions(list);
        setShowCompanyList(true);
      } catch (e) {
        setCompanyOptions([]);
      } finally {
        setLoadingCompanies(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, companyQuery]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!open) return;
      const q = accountQuery.trim();
      if (q.length < 2 || accountPreview) return;
      try {
        setLoadingAccounts(true);
        const res = await api.get('/conta', { params: { q, page: 0, size: 20 } });
        const data = res.data?.content || res.data || [];
        const list: BankAccount[] = data
          .map((c: any) => ({
            idConta: c.idConta ?? c.id,
            agencia: String(c.agencia ?? ''),
            conta: String(c.conta ?? ''),
            dvConta: c.dvConta ?? '',
            fkBanco: { nomeBanco: c.fkBanco?.nomeBanco ?? c.banco?.nome },
          }))
          .filter((c: any) => !!c.idConta);
        setAccountOptions(list);
        setShowAccountList(true);
      } catch (e) {
        setAccountOptions([]);
      } finally {
        setLoadingAccounts(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, accountQuery, accountPreview]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Editar Conta a Receber #{item.id}</h2>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Empresa (Cliente) *</label>
            <div className="relative">
              <input
                type="text"
                value={companyQuery}
                onChange={(e) => {
                  setCompanyQuery(e.target.value);
                  setSelectedCompany(null);
                }}
                onFocus={() => setShowCompanyList(true)}
                placeholder="Digite para buscar a empresa..."
                className="input-field"
              />
              {showCompanyList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingCompanies ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : companyQuery.trim().length < 2 ? (
                    <div className="p-3 text-sm text-secondary-500">Digite pelo menos 2 caracteres</div>
                  ) : companyOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">Nenhuma empresa encontrada</div>
                  ) : (
                    companyOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setSelectedCompany(opt);
                          setCompanyQuery(opt.name);
                          setShowCompanyList(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-secondary-50"
                      >
                        <div className="text-sm text-secondary-900">ID: {opt.id} • {opt.name}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedCompany && (
                <div className="text-xs text-secondary-600 mt-1">Selecionada: ID {selectedCompany.id} • {selectedCompany.name}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Conta Bancária *</label>
            <div className="relative">
              <input
                type="text"
                value={accountQuery}
                onChange={(e) => {
                  setAccountQuery(e.target.value);
                  setSelectedAccount(null);
                  setAccountPreview(null);
                }}
                onFocus={() => setShowAccountList(true)}
                placeholder="Digite para buscar (banco, agência ou conta)..."
                className="input-field"
              />
              {showAccountList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingAccounts ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : accountOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">
                      {accountQuery.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhuma conta encontrada'}
                    </div>
                  ) : (
                    accountOptions.map((acc) => (
                      <button
                        type="button"
                        key={acc.idConta}
                        onClick={() => {
                          setAccountPreview(acc);
                          setShowAccountList(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-secondary-50"
                      >
                        <div className="text-sm text-secondary-900">
                          ID: {acc.idConta} • {acc.fkBanco?.nomeBanco || 'Banco'} • Ag {acc.agencia} • Cc {acc.conta}-{acc.dvConta}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {(selectedAccount || accountPreview) && (
                <div className="mt-2 rounded-md border bg-secondary-50 p-3">
                  <div className="text-sm font-semibold mb-1">Resumo da conta selecionada</div>
                  <div className="text-sm text-secondary-900">
                    ID: {accountPreview?.idConta ?? selectedAccount?.idConta}
                  </div>
                  <div className="text-sm text-secondary-900">
                    Banco: {accountPreview?.fkBanco?.nomeBanco ?? selectedAccount?.fkBanco?.nomeBanco ?? '-'}
                  </div>
                  <div className="text-sm text-secondary-900">
                    Agência: {accountPreview?.agencia ?? selectedAccount?.agencia} • Conta: {accountPreview?.conta ?? selectedAccount?.conta}-{accountPreview?.dvConta ?? selectedAccount?.dvConta}
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    {accountPreview ? (
                      <>
                        <button type="button" className="px-3 py-1 border rounded-md text-sm" onClick={() => setAccountPreview(null)}>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn-primary px-3 py-1 text-sm"
                          onClick={() => {
                            setSelectedAccount(accountPreview);
                            setAccountQuery(
                              `${accountPreview.fkBanco?.nomeBanco || 'Banco'} • Ag ${accountPreview.agencia} • Cc ${accountPreview.conta}-${accountPreview.dvConta}`
                            );
                            setAccountPreview(null);
                          }}
                        >
                          Confirmar
                        </button>
                      </>
                    ) : (
                      <button type="button" className="px-3 py-1 border rounded-md text-sm" onClick={() => setSelectedAccount(null)}>
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              )}
              {selectedAccount && (
                <div className="text-xs text-secondary-600 mt-1">
                  Selecionada: ID {selectedAccount.idConta}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <input
                type="text"
                value={form.descricaoReceber}
                onChange={(e) => setForm({ ...form, descricaoReceber: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de Pagamento *</label>
              <select
                value={form.formaPagamento}
                onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                className="input-field"
              >
                <option value="">Selecione</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="BOLETO">Boleto</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="PIX">PIX</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Emissão *</label>
              <input
                type="date"
                value={form.dataEmissao}
                onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Vencimento *</label>
              <input
                type="date"
                value={form.dataVencimento}
                onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Recebimento</label>
              <input
                type="date"
                value={form.dataRec}
                onChange={(e) => setForm({ ...form, dataRec: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor *</label>
              <input
                type="number"
                step="0.01"
                value={form.valorReceber}
                onChange={(e) => setForm({ ...form, valorReceber: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário *</label>
              <input
                type="text"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 border rounded-md" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="button"                
              className="btn-primary"
              disabled={submitting}
              onClick={submitEdit}          
            >
              {submitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Receivables;