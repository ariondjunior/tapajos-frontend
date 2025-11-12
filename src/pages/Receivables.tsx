import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

// Tipos da API
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

  // Paginação
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
      // ✅ Spring Data usa 'page' e 'size'
      const res = await api.get<PaginatedResponse<ContaReceberApi>>('/receber', {
        params: { page, size },
      });

      console.log('GET /receber =>', res.data);
      const contas = res.data?.content || [];
      const mapped = contas.map(mapContaReceberToReceivable);

      setReceivables(mapped);
      setFilteredData(applyFilters(mapped, searchTerm, filterStatus));

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

  const applyFilters = (
    data: ReceivableItem[],
    term: string,
    status: 'all' | 'pending' | 'paid' | 'overdue'
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

    out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return out;
  };

  useEffect(() => {
    if (!hasSearched) return;
    setFilteredData(applyFilters(receivables, searchTerm, filterStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus]);

  const handleSearchClick = () => handleSearch(0, pageSize);

  const handleEdit = (item: ReceivableItem) => {
    // Abre modal com o item selecionado
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
    if (hasSearched) handleSearch(0, newSize); // ✅ passa 'size' corretamente
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    handleSearch(newPage, pageSize);
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

  // Resumo
  const totalPending = receivables
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const countPending = receivables.filter((r) => r.status === 'pending').length;
  const countPaid = receivables.filter((r) => r.status === 'paid').length;

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
              onClick={handleSearchClick}
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

        {errorMsg && (
          <div className="mt-3 px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty state (antes da busca) */}
      {!hasSearched && !loading && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-secondary-300 mb-4" />
            <p className="text-secondary-500 text-lg">Clique em "Pesquisar" para visualizar as contas a receber</p>
            <p className="text-secondary-400 text-sm mt-2">Você pode escolher quantos itens deseja ver por página</p>
          </div>
        </div>
      )}

      {/* Resumo */}
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

      {/* Tabela */}
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
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de edição */}
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
          // Recarrega a página atual após atualizar
          handleSearch(currentPage, pageSize);
        }}
      />

      {/* Modal de criação */}
      <CreateReceivableModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSaved={() => {
          setShowCreateModal(false);
          // Recarrega a página atual após criar
          handleSearch(currentPage, pageSize);
        }}
      />
    </div>
  );
};

// ---------------- Modal de Criação ----------------
const CreateReceivableModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: authUser } = useAuth();

  // Empresa (autocomplete)
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [companySelectedQuery, setCompanySelectedQuery] = useState('');

  // Conta (autocomplete com prévia)
  const [accountQuery, setAccountQuery] = useState('');
  const [accountOptions, setAccountOptions] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [accountSelectedQuery, setAccountSelectedQuery] = useState('');

  // Form
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

  // Reset form when modal opens
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

  // Busca empresas (q >= 2)
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
          const list: CompanyOption[] = data
            .map((e: any) => ({
              id: e.idEmpresa ?? e.id,
              name: e.nomeFantasia ?? e.razaoSocial ?? e.nome,
            }))
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

  // Busca contas (q >= 2)
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

    // Validações mínimas
    if (!empresaId) return setError('Selecione a empresa (cliente)');
    if (!contaId) return setError('Selecione a conta bancária');
    if (!form.descricaoReceber.trim()) return setError('Informe a descrição');
    if (!form.formaPagamento) return setError('Informe a forma de pagamento');
    if (!form.dataEmissao) return setError('Informe a data de emissão');
    if (!form.dataVencimento) return setError('Informe a data de vencimento');
    if (!usuarioValue) return setError('Informe o usuário');
    if (!form.valorReceber || Number(form.valorReceber) <= 0) return setError('Informe um valor válido');

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

          {/* Empresa */}
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

          {/* Conta */}
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

          {/* Campos principais */}
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
// ---------------- Fim do Modal de Criação ----------------

// ---------------- Modal de Edição ----------------
const EditReceivableModal: React.FC<{
  open: boolean;
  item: ReceivableItem | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, item, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: authUser } = useAuth();

  // Empresa (autocomplete)
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showCompanyList, setShowCompanyList] = useState(false);

  // Conta (autocomplete com prévia)
  const [accountQuery, setAccountQuery] = useState('');
  const [accountOptions, setAccountOptions] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [accountPreview, setAccountPreview] = useState<BankAccount | null>(null);

  // Form
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

  // Função centralizada de submit do PUT
  const submitEdit = async () => {
    if (!item) return;

    const empresaId = getEmpresaId();
    const contaId = getContaId();

    console.debug('[submitEdit] Iniciando update para id:', item.id);

    const usuarioValue = (authUser?.name || form.usuario || '').trim();

    // Validações mínimas (entidade exige @NotNull/@NotBlank e @ManyToOne(optional=false))
    if (!empresaId) return setError('Selecione a empresa');
    if (!contaId) return setError('Selecione a conta bancária');
    if (!form.descricaoReceber.trim()) return setError('Informe a descrição');
    if (!form.formaPagamento) return setError('Informe a forma de pagamento');
    if (!form.dataEmissao) return setError('Informe a data de emissão');
    if (!form.dataVencimento) return setError('Informe a data de vencimento');
    if (!usuarioValue) return setError('Informe o usuário');
    if (!form.valorReceber || Number(form.valorReceber) <= 0) return setError('Informe um valor válido');

    // ✅ envia no formato da entidade (com id no path e no corpo)
    const url = `/receber/${Number(item.id)}`;
    const payload = {
      idReceber: Number(item.id), // requerido pelo @Validated(UpdateReceber)
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

  // Handler para submit via Enter no form
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    submitEdit();
  };

  useEffect(() => {
    if (!open || !item) return;

    // Preenche formulário com o item selecionado
    setForm({
      descricaoReceber: item.description || '',
      valorReceber: String(item.amount ?? ''),
      formaPagamento: item.paymentMethod || '',
      // prefer session user when editing, fallback to item.user
      usuario: authUser?.name || item.user || '',
      dataEmissao: dateToInput(item.issueDate),
      dataVencimento: dateToInput(item.dueDate),
      dataRec: item.paymentDate ? dateToInput(item.paymentDate) : '',
    });

    // Empresa selecionada
    setSelectedCompany(
      item.clientId
        ? { id: item.clientId, name: item.clientName }
        : null
    );
    setCompanyQuery(item.clientName || '');
    setCompanyOptions([]);
    setShowCompanyList(false);

    // Conta selecionada
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

  // Busca empresas (q >= 2)
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
        const list: CompanyOption[] = data
          .map((e: any) => ({
            id: e.idEmpresa ?? e.id,
            name: e.nomeFantasia ?? e.razaoSocial ?? e.nome,
          }))
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

  // Busca contas (q >= 2)  ✅ usa 'size' em vez de 'pageSize'
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

          {/* Empresa */}
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

          {/* Conta */}
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

          {/* Campos principais */}
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
              type="button"                 // ✅ evita depender do submit do form
              className="btn-primary"
              disabled={submitting}
              onClick={submitEdit}          // ✅ chama diretamente o PUT
            >
              {submitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// ---------------- Fim do Modal ----------------

export default Receivables;