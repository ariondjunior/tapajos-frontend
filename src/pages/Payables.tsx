import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

// Tipo local para conta bancária (compatível com dados retornados pela API)
type BankAccount = {
  idConta: number | string;
  agencia?: string;
  conta?: string;
  saldo?: number;
  tipoConta?: string;
  statusConta?: number;
  dvConta?: number | string;
  fkBanco?: {
    idBanco?: number | string;
    nomeBanco?: string;
  };
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

// Modal de criação/edição no estilo do modal de Conta a Receber
interface EditModalProps {
  open: boolean;
  item: PayableItem | null;
  onClose: () => void;
  onSave: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ open, item, onClose, onSave }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fornecedor (autocomplete)
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: number; name: string } | null>(null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [supplierSelectedQuery, setSupplierSelectedQuery] = useState('');

  // Conta (autocomplete)
  const [accountQuery, setAccountQuery] = useState('');
  const [accountOptions, setAccountOptions] = useState<Array<BankAccount>>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [accountSelectedQuery, setAccountSelectedQuery] = useState('');

  // Form
  const [form, setForm] = useState({
    descricaoPagar: '',
    valorPagar: '',
    formaPagamento: '',
    usuario: '',
    dataEmissao: '',
    dataVencimento: '',
    dataPag: '',
  });

  const { user: authUser } = useAuth();

  const dateToInput = (d?: Date | null) => {
    if (!d) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const inputToDateTime = (s: string) => (s ? `${s}T12:00:00` : null);
  const getEmpresaId = () => (selectedSupplier?.id ?? item?.supplierId ?? null);
  const getContaId = () => (selectedAccount?.idConta ?? item?.accountId ?? null);

  useEffect(() => {
    if (!open) return;

    // Preenche formulário quando editar
    if (item) {
      setForm({
        descricaoPagar: item.description || '',
        valorPagar: String(item.amount ?? ''),
        formaPagamento: '',
        usuario: item.user || authUser?.name || '',
        dataEmissao: dateToInput(item.issueDate),
        dataVencimento: dateToInput(item.dueDate),
        dataPag: item.paymentDate ? dateToInput(item.paymentDate) : '',
      });

      setSelectedSupplier(item.supplierId ? { id: item.supplierId, name: item.supplierName } : null);
      setSupplierQuery(item.supplierName || '');
      setSupplierOptions([]);
      setShowSupplierList(false);

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
    } else {
      // reset form for creation
      setForm({
        descricaoPagar: '',
        valorPagar: '',
        formaPagamento: '',
        usuario: authUser?.name || '',
        dataEmissao: '',
        dataVencimento: '',
        dataPag: '',
      });
      setSelectedSupplier(null);
      setSupplierQuery('');
      setSupplierOptions([]);
      setShowSupplierList(false);

      setSelectedAccount(null);
      setAccountQuery('');
      setAccountOptions([]);
      setShowAccountList(false);
    }

    setError(null);
  }, [open, item]);

  // Busca fornecedores (/empresa?q=)
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    const t = setTimeout(() => {
      if (!open || !showSupplierList) return;
      const q = supplierQuery.trim();
      if (supplierSelectedQuery && supplierSelectedQuery === q) return;
      if (q.length < 2) {
        if (mounted) setSupplierOptions([]);
        return;
      }

      controller = new AbortController();
      setLoadingSuppliers(true);

      api
        .get('/empresa', { params: { q }, signal: controller.signal })
        .then((res) => {
          if (!mounted) return;
          const data = res.data?.content || res.data || [];
          const list = data
            .map((e: any) => ({ id: e.idEmpresa ?? e.id, name: e.nomeFantasia ?? e.razaoSocial ?? e.nome }))
            .filter((e: any) => e.id && e.name);
          setSupplierOptions(list);
          setShowSupplierList(true);
        })
        .catch(() => {
          if (!mounted) return;
          setSupplierOptions([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingSuppliers(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (controller) controller.abort();
    };
  }, [open, supplierQuery, supplierSelectedQuery, showSupplierList]);

  // Busca contas (/conta?q=)
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
            .filter((c: BankAccount) => !!c.idConta);
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

  const submit = async () => {
    const empresaId = getEmpresaId();
    const contaId = getContaId();

    // Validações mínimas
    const usuarioValue = (authUser?.name || form.usuario || '').trim();

    if (!empresaId) return setError('Selecione o fornecedor (empresa)');
    if (!contaId) return setError('Selecione a conta bancária');
    if (!form.descricaoPagar.trim()) return setError('Informe a descrição');
    if (!form.formaPagamento) return setError('Informe a forma de pagamento');
    if (!form.dataEmissao) return setError('Informe a data de emissão');
    if (!form.dataVencimento) return setError('Informe a data de vencimento');
    if (!usuarioValue) return setError('Informe o usuário');
    if (!form.valorPagar || Number(form.valorPagar) <= 0) return setError('Informe um valor válido');

    // Verifica saldo da conta e guarda os valores
    const response = await api.get(`/conta/${contaId}`);
    const conta = response.data;

    if (!conta) return setError('Conta não encontrada');
    const saldo = Number(conta.saldo);
    const valorPagar = Number(form.valorPagar);

    const payload = {
      ...(item ? { idContaPagar: Number(item.id) } : {}),
      valorPagar: Number(form.valorPagar),
      dataVencimento: inputToDateTime(form.dataVencimento),
      formaPagamento: form.formaPagamento,
      dataEmissao: inputToDateTime(form.dataEmissao),
      dataPag: form.dataPag ? inputToDateTime(form.dataPag) : null,
      descricaoPagar: form.descricaoPagar,
      // Prefer logged-in session user, fallback to form value
      usuario: usuarioValue,
      empresa: { idEmpresa: Number(empresaId) },
      conta: { idConta: Number(contaId) },
    };

    try {
      setSubmitting(true);
      setError(null);
      if (item) {
        await api.put(`/pagar/${Number(item.id)}`, payload);
        alert('Conta a pagar atualizada com sucesso!');
      } //Tratamento de erro com verificação do saldo
      else if (valorPagar > saldo) return setError(`Saldo insuficiente. Saldo disponível: R$ ${saldo.toFixed(2)}`);
      else {
        await api.post('/pagar', payload);
        alert('Conta a pagar criada com sucesso!');
      }
      onSave();
    } catch (err: any) {
      console.error('Erro no salvar /pagar:', err?.response || err);
      const data = err?.response?.data;
      setError(typeof data === 'string' ? data : data?.message || 'Falha ao salvar conta a pagar');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{item ? `Editar Conta a Pagar #${item.id}` : 'Criar Nova Conta a Pagar'}</h2>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {error && (
            <div className="px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
          )}

          {/* Fornecedor */}
          <div>
            <label className="block text-sm font-medium mb-1">Fornecedor (Empresa) *</label>
            <div className="relative">
              <input
                type="text"
                value={supplierQuery}
                onChange={(e) => { setSupplierQuery(e.target.value); setSelectedSupplier(null); setSupplierSelectedQuery(''); }}
                onFocus={() => { setSupplierSelectedQuery(''); setShowSupplierList(true); }}
                placeholder="Digite para buscar o fornecedor..."
                className="input-field"
              />
              {showSupplierList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingSuppliers ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : supplierQuery.trim().length < 2 ? (
                    <div className="p-3 text-sm text-secondary-500">Digite pelo menos 2 caracteres</div>
                  ) : supplierOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">Nenhum fornecedor encontrado</div>
                  ) : (
                    supplierOptions.map((opt) => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-secondary-50" onClick={() => { setSelectedSupplier(opt); setSupplierQuery(opt.name); setSupplierSelectedQuery(opt.name); setShowSupplierList(false); }}>
                        <div className="text-sm text-secondary-900">ID: {opt.id} • {opt.name}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedSupplier && (
                <div className="text-xs text-secondary-600 mt-1">Selecionado: ID {selectedSupplier.id} • {selectedSupplier.name}</div>
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
                onChange={(e) => { setAccountQuery(e.target.value); setSelectedAccount(null); setAccountSelectedQuery(''); }}
                onFocus={() => { setAccountSelectedQuery(''); setShowAccountList(true); }}
                placeholder="Digite para buscar (banco, agência ou conta)..."
                className="input-field"
              />
              {showAccountList && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingAccounts ? (
                    <div className="p-3 text-sm text-secondary-500">Carregando...</div>
                  ) : accountOptions.length === 0 ? (
                    <div className="p-3 text-sm text-secondary-500">{accountQuery.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhuma conta encontrada'}</div>
                  ) : (
                    accountOptions.map((acc) => (
                      <button key={acc.idConta} type="button" className="w-full text-left px-3 py-2 hover:bg-secondary-50" onClick={() => { const label = `${acc.fkBanco?.nomeBanco || 'Banco'} • Ag ${acc.agencia} • Cc ${acc.conta}-${acc.dvConta}`; setSelectedAccount(acc); setAccountQuery(label); setAccountSelectedQuery(label); setShowAccountList(false); }}>
                        <div className="text-sm text-secondary-900">ID: {acc.idConta} • {acc.fkBanco?.nomeBanco || 'Banco'} • Ag {acc.agencia} • Cc {acc.conta}-{acc.dvConta}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedAccount && (
                <div className="mt-2 rounded-md border bg-secondary-50 p-3">
                  <div className="text-sm font-semibold mb-1">Resumo da conta selecionada</div>
                  <div className="text-sm text-secondary-900">ID: {selectedAccount.idConta}</div>
                  <div className="text-sm text-secondary-900">Banco: {selectedAccount.fkBanco?.nomeBanco ?? '-'}</div>
                  <div className="text-sm text-secondary-900">Agência: {selectedAccount.agencia} • Conta: {selectedAccount.conta}-{selectedAccount.dvConta}</div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" className="px-3 py-1 border rounded-md text-sm" onClick={() => setSelectedAccount(null)}>Limpar</button>
                  </div>
                </div>
              )}
              {selectedAccount && (
                <div className="text-xs text-secondary-600 mt-1">Selecionada: ID {selectedAccount.idConta}</div>
              )}
            </div>
          </div>

          {/* Campos principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input type="text" value={form.descricaoPagar} onChange={(e) => setForm({ ...form, descricaoPagar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de Pagamento *</label>
              <select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} className="input-field">
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
              <input type="date" value={form.dataEmissao} onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Vencimento *</label>
              <input type="date" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Pagamento</label>
              <input type="date" value={form.dataPag} onChange={(e) => setForm({ ...form, dataPag: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor *</label>
              <input type="number" step="0.01" value={form.valorPagar} onChange={(e) => setForm({ ...form, valorPagar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usuário</label>
              <input 
                type="text" 
                value={form.usuario || ''} 
                readOnly 
                className="input-field bg-gray-50 cursor-not-allowed" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 border rounded-md" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="button" className="btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Salvando...' : (item ? 'Salvar alterações' : 'Criar Conta a Pagar')}</button>
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
      
      const contas = res.data.content || [];
      
      if (contas.length === 0) {
        console.warn('Nenhuma conta retornada da API');
      }

      const mapped = contas.map(mapContaPagarToPayable);
      
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
          open={showEditModal}
          item={selectedItem}
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