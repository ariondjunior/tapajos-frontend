import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { clientSupplierService, bankService, movimentacaoService, bankTransactionService, userService } from '../services';
import { useFinance } from '../contexts/FinanceContext';
import { ClientSupplier, Bank, BankTransaction, User } from '../types';
import api from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Reports: React.FC = () => {
  const [extratoDiario, setExtratoDiario] = useState<any[]>([]);
  const [extratoPeriodo, setExtratoPeriodo] = useState<any[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [clientSuppliers, setClientSuppliers] = useState<ClientSupplier[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BankTransaction[]>([]);
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txFilterBank, setTxFilterBank] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const { banks: financeBanks } = useFinance();
  const [financeAccounts, setFinanceAccounts] = useState<Bank[]>([]);
  const pageSize = 10;

  useEffect(() => {
    const init = async () => {
      try {
        const [clients, bankList, txs, user] = await Promise.all([
          clientSupplierService.getAll(),
          bankService.getAll(),
          bankTransactionService.getAll(),
          userService.getCurrentUser()
        ]);
        setClientSuppliers(clients || []);
        setBanks(bankList || []);
        setTransactions(txs || []);
        setFilteredTransactions(txs || []);
        setCurrentUser(user || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    let filtered = transactions.slice();
    if (txFilterBank) filtered = filtered.filter(t => t.bankId === txFilterBank);
    if (txFilterType !== 'all') filtered = filtered.filter(t => t.type === txFilterType);
    if (txSearchTerm) filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(txSearchTerm.toLowerCase()));
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredTransactions(filtered);
  }, [transactions, txSearchTerm, txFilterBank, txFilterType]);

  const [movimentacaoData, setMovimentacaoData] = useState<any>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10
  });

  const [currentMovPage, setCurrentMovPage] = useState(0);
  const loadExtratoDiario = async () => {
    try {
      const page = await movimentacaoService.getMovimentacoes(currentMovPage, 10);
      setMovimentacaoData(page || {
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10
      });
      setExtratoDiario(page?.content || []);
      await loadDailySummary();
    } catch (err) {
      console.error('Erro extrato diário', err);
      setExtratoDiario([]);
      setMovimentacaoData({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10
      });
    }
  };
  
  useEffect(() => {
  loadExtratoDiario();
}, [currentMovPage])

const handlePreviousPage = () => {
  if (currentMovPage > 0) {
    setCurrentMovPage(currentMovPage - 1);
  }
};

const handleNextPage = () => {
  if (currentMovPage < movimentacaoData.totalPages - 1) {
    setCurrentMovPage(currentMovPage + 1);
  }
};

const handleGoToPage = (page: number) => {
  if (page >= 0 && page < movimentacaoData.totalPages) {
    setCurrentMovPage(page);
  }
};


  const loadDailySummary = async () => {
    try {
      setLoadingDaily(true);
      const res = await movimentacaoService.getExtratoDiario();
      setDailySummary(res || []);
      try {
        const PAGE_SIZE = 100;
        const first = await api.get('/conta', { params: { page: 0, size: PAGE_SIZE } });
        let all = first.data.content || [];
        const totalPages = Number(first.data.totalPages ?? 1);
        if (totalPages > 1) {
          const promises = [];
          for (let p = 1; p < totalPages; p++) promises.push(api.get('/conta', { params: { page: p, size: PAGE_SIZE } }));
          const pages = await Promise.all(promises);
          pages.forEach(r => { all = all.concat(r.data.content || []); });
        }
        const mapped = (all || []).map((c: any) => ({
          id: String(c.idConta),
          name: `${c.fkBanco?.nomeBanco ?? 'Banco'} • Ag ${c.agencia} Cc ${c.conta}-${c.dvConta}`,
          balance: Number(c.saldo ?? 0)
        }));
        setFinanceAccounts(mapped);
      } catch (err) {
        console.error('Erro ao recarregar contas (/conta):', err);
      }
    } catch (err) {
      console.error('Erro ao buscar extrato do dia', err);
      setDailySummary([]);
    } finally {
      setLoadingDaily(false);
    }
  };

  const formatForBackend = (localDatetime: string) => {
    if (!localDatetime) return '';
    return localDatetime.length === 16 ? `${localDatetime}:00` : localDatetime;
  };

  const loadExtratoPeriodo = async () => {
    if (!periodStart || !periodEnd) {
      alert('Escolha data/hora de início e fim');
      return;
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    if (endDate.getTime() < startDate.getTime()) {
      alert('A data final deve ser igual ou posterior à data inicial');
      return;
    }

    try {
      const dataInicio = formatForBackend(periodStart);
      const dataFim = formatForBackend(periodEnd);
      const data = await movimentacaoService.getExtratoPeriodo(dataInicio, dataFim);
      setExtratoPeriodo(data || []);
    } catch (err) {
      console.error('Erro extrato periodo', err);
      setExtratoPeriodo([]);
    }
  };

  const formatDate = (input: any) => {
    try {
      const d = input instanceof Date ? input : new Date(input);
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
    } catch {
      return String(input);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getDescription = (it: any) => {
    if (!it) return '-';
    const candidates = [
      it.descricao,
      it.descricaoPagar,
      it.descricaoReceber,
      it.description,
      it.historico,
      it.historicoMovimentacao,
      it.observacao,
      it.descricaoMovimentacao,
      it['descricao_movimentacao'],
      it.details,
      it.note,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c).toString().trim() !== '') return String(c);
    }
    return '-';
  };

  async function buscarMovimentacoes() {
    try {
      const resposta = await fetch("http://localhost:8080/movimentacao?page=0&pageSize=10");

      const dados = await resposta.json();
    } catch (erro) {
      console.error("Ocorreu um erro:", erro);
    }

  }
  const botao = document.getElementById("getMov");
  botao?.addEventListener("click", buscarMovimentacoes);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename + '.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios Gerenciais</h1>
        <p className="text-secondary-600">Extratos total e por período</p>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-semibold">Extrato do Dia</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={loadDailySummary} className="btn-primary">Atualizar</button>
            </div>
          </div>

          <div className="card p-4">
            {loadingDaily ? (
              <div className="text-center py-8">Carregando resumo do dia...</div>
            ) : (
              (() => {
                const paidItem = dailySummary.find((d: any) => String(d.tipo).toLowerCase().includes('pago')) || { valor: 0 };
                const receivedItem = dailySummary.find((d: any) => String(d.tipo).toLowerCase().includes('receb')) || { valor: 0 };
                const paid = Number(paidItem.valor ?? 0) || 0;
                const received = Number(receivedItem.valor ?? 0) || 0;

                const chartData = {
                  labels: ['Recebido', 'Pago'],
                  datasets: [
                    {
                      data: [received, paid],
                      backgroundColor: ['#10b981', '#ef4444'],
                      hoverBackgroundColor: ['#059669', '#dc2626'],
                      borderWidth: 0
                    }
                  ]
                };

                const chartOptions: any = {
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10,
                        padding: 10,
                        font: {
                          size: 11
                        },
                        color: '#333',
                        align: 'center'
                      }
                    }
                  }
                };

                return (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-6 ">
                      <div style={{ width: 140, height: 140 }} className="flex-shrink-0">
                        <Pie data={chartData} options={chartOptions} />
                      </div>

                      <div className="flex flex-col gap-3 justify-center items-start">
                        <div>
                          <div className="flex items-center mb-2">
                            <span className="w-3 h-3 inline-block mr-2 rounded-full bg-green-500" />
                            <div className="text-sm">Recebido: <span className="font-semibold">{formatCurrency(received)}</span></div>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 inline-block mr-2 rounded-full bg-red-500" />
                            <div className="text-sm">Pago: <span className="font-semibold">{formatCurrency(paid)}</span></div>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="md:w-1/3 md:pl-6 md:border-l md:border-secondary-200">
                      <div className="text-sm font-medium text-secondary-600 mb-2">Saldos por Conta</div>
                      <div>
                        <div className="space-y-2 max-h-44 overflow-auto pr-2">
                          {financeAccounts && financeAccounts.length > 0 ? (
                            financeAccounts.map((b: any) => (
                              <div key={b.id} className="text-sm text-secondary-800">
                                <div className="font-medium truncate">{b.name}</div>
                                <div className="text-xs text-secondary-500">ID: {b.id} — {formatCurrency(Number(b.balance ?? 0))}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-secondary-500">Nenhuma conta encontrada</div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-secondary-200">
                          <div className="text-sm text-secondary-600">Total em Bancos</div>
                          <div className="text-lg font-semibold text-secondary-900">
                            {formatCurrency(
                              (financeAccounts || []).reduce((s: number, b: any) => s + Number(b.balance ?? 0), 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">Movimentações</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={loadExtratoDiario} className="btn-primary">Carregar</button>
            <button onClick={() => exportToCSV(extratoDiario, 'extrato-diario')} className="btn-secondary">Exportar CSV</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="card p-4">
            <p className="text-sm font-medium text-secondary-600">Total Créditos</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(
                extratoDiario
                  .filter((it: any) => !(it?.tipoDuplicata === 0 || it?.tipo === 'pagar'))
                  .reduce((s: number, it: any) => s + Number(it?.valor ?? it?.valorMov ?? it?.amount ?? 0), 0)
              )}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-secondary-600">Total Débitos</p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(
                extratoDiario
                  .filter((it: any) => it?.tipoDuplicata === 0 || it?.tipo === 'pagar')
                  .reduce((s: number, it: any) => s + Number(it?.valor ?? it?.valorMov ?? it?.amount ?? 0), 0)
              )}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-secondary-600">Total Movimentações</p>
            <p className="text-2xl font-semibold text-secondary-900">{movimentacaoData.totalElements}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Banco</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Descrição</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Forma Pagamento</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Usuário</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {extratoDiario.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">Nenhuma movimentação</td>
                  </tr>
                ) : (
                  extratoDiario.map((it: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatDate(it.dataRegistroMovimentacao)}</td>
                      <td className="px-6 py-4 text-sm">{it.conta?.fkBanco?.nomeBanco || '-'}</td>
                      <td className="px-6 py-4 text-sm">{getDescription(it)}</td>
                      <td className="px-6 py-4 text-sm text-center">{it.formaPagamento}</td>
                      <td className={`px-6 py-4 text-sm text-right font-medium ${it.tipoDuplicata === 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(it.valor)}
                      </td>
                      <td className="px-6 py-4 text-sm">{it.usuario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between ml-5 mt-4 mr-5">
          <div className="text-sm text-secondary-700">
            <p className="text-sm text-secondary-700">
                Mostrando <span className="font-medium">{currentMovPage * pageSize + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min((currentMovPage + 1) * pageSize, movimentacaoData.totalElements)}
                </span>{' '}
                de <span className="font-medium">{movimentacaoData.totalElements}</span> resultados
            </p>
          </div>

          <div
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px justify-end"
            aria-label="Pagination"
          >
            {/* anterior */}
            <button
              onClick={handlePreviousPage}
              disabled={currentMovPage === 0}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
                
            
            {Array.from({ length: movimentacaoData.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleGoToPage(i)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === currentMovPage
                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                    : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            {/* proximo */}
            <button
              onClick={handleNextPage}
              disabled={currentMovPage >= movimentacaoData.totalPages - 1}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>


        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-semibold">Extrato por Período</h3>
            </div>
            <div className="flex items-center space-x-2">
              <input type="datetime-local" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="input-field" />
              <input type="datetime-local" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="input-field" />
              <button onClick={loadExtratoPeriodo} className="btn-primary">Buscar</button>
              <button onClick={() => exportToCSV(extratoPeriodo, 'extrato-periodo')} className="btn-secondary">Exportar CSV</button>
            </div>
          </div>

          <div className="p-4">
            {extratoPeriodo.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">Nenhuma movimentação para o período</div>
            ) : (
              (() => {
                const paidItem = extratoPeriodo.find((d: any) => String(d.tipo).toLowerCase().includes('pago')) || { valor: null };
                const receivedItem = extratoPeriodo.find((d: any) => String(d.tipo).toLowerCase().includes('receb')) || { valor: null };
                const totalPaid = extratoPeriodo.reduce((s: number, it: any) => s + (it.tipoDuplicata === 0 || it.tipo === 'pagar' ? Number(it.valor ?? it.valorMov ?? it.amount ?? 0) : 0), 0);
                const totalReceived = extratoPeriodo.reduce((s: number, it: any) => s + (!(it.tipoDuplicata === 0 || it.tipo === 'pagar') ? Number(it.valor ?? it.valorMov ?? it.amount ?? 0) : 0), 0);

                const data = {
                  labels: ['Recebido', 'Pago'],
                  datasets: [
                    {
                      label: 'Valores',
                      data: [totalReceived || Number(receivedItem.valor ?? 0), totalPaid || Number(paidItem.valor ?? 0)],
                      backgroundColor: ['#10b981', '#ef4444']
                    }
                  ]
                };

                const options: any = {
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div style={{ height: 260 }} className="card p-4">
                      <Bar data={data} options={options} />
                    </div>

                    <div className="card p-4">
                      <div className="text-sm font-medium text-secondary-600 mb-2">Resumo do Período</div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 inline-block rounded-full bg-green-500" />
                            <div className="text-sm">Recebido</div>
                          </div>
                          <div className="text-sm font-semibold text-green-600">{formatCurrency(totalReceived || Number(receivedItem.valor ?? 0))}</div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 inline-block rounded-full bg-red-500" />
                            <div className="text-sm">Pago</div>
                          </div>
                          <div className="text-sm font-semibold text-red-600">{formatCurrency(totalPaid || Number(paidItem.valor ?? 0))}</div>
                        </div>

                        <div className="pt-3 border-t border-secondary-200">
                          <div className="text-sm text-secondary-600">Total Movimentações</div>
                          <div className="text-lg font-semibold text-secondary-900">{extratoPeriodo.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
      );
};

      export default Reports;