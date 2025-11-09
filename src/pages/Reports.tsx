import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { clientSupplierService, bankService, movimentacaoService, bankTransactionService, userService } from '../services';
import { useFinance } from '../contexts/FinanceContext';
import { ClientSupplier, Bank, BankTransaction, User } from '../types';

const Reports: React.FC = () => {
  const [extratoDiario, setExtratoDiario] = useState<any[]>([]);
  const [extratoPeriodo, setExtratoPeriodo] = useState<any[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [clientSuppliers, setClientSuppliers] = useState<ClientSupplier[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  // bank transactions moved here
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BankTransaction[]>([]);
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txFilterBank, setTxFilterBank] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const { banks: financeBanks } = useFinance();

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
    // apply filters to transactions whenever inputs change
    let filtered = transactions.slice();
    if (txFilterBank) filtered = filtered.filter(t => t.bankId === txFilterBank);
    if (txFilterType !== 'all') filtered = filtered.filter(t => t.type === txFilterType);
    if (txSearchTerm) filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(txSearchTerm.toLowerCase()));
    // sort by newest
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredTransactions(filtered);
  }, [transactions, txSearchTerm, txFilterBank, txFilterType]);

  const loadExtratoDiario = async () => {
    try {
      // load paginated movimentacoes (full movements) and use the content array
      const page = await movimentacaoService.getMovimentacoes(0, 100);
      const content = page?.content || [];
      setExtratoDiario(content);
      // also refresh daily summary when loading movimentacoes
      await loadDailySummary();
    } catch (err) {
      console.error('Erro extrato diário', err);
      setExtratoDiario([]);
    }
  };

  const loadDailySummary = async () => {
    try {
      setLoadingDaily(true);
      const res = await movimentacaoService.getExtratoDiario();
      // expect array like [{ tipo: 'Pago', valor: 800.00 }, { tipo: 'Recebido', valor: null }]
      setDailySummary(res || []);
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
        {/* Extrato do Dia - gráfico de pizza */}
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
                const total = paid + received || 1; // avoid div by zero
                const receivedPct = received / total;
                const paidPct = paid / total;
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const receivedDash = receivedPct * circumference;
                const paidDash = paidPct * circumference;

                return (
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                      <g transform="translate(60,60)">
                        <circle r={radius} fill="#f3f4f6" />
                        {/* received slice (green) */}
                        <circle
                          r={radius}
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth={radius * 2}
                          strokeDasharray={`${receivedDash} ${circumference - receivedDash}`}
                          transform="rotate(-90)"
                          strokeLinecap="butt"
                        />
                        {/* paid slice (red) */}
                        <circle
                          r={radius}
                          fill="transparent"
                          stroke="#ef4444"
                          strokeWidth={radius * 2}
                          strokeDasharray={`${paidDash} ${circumference - paidDash}`}
                          transform={`rotate(${ -90 + (receivedPct * 360) })`}
                          strokeLinecap="butt"
                        />
                        <text x="0" y="6" textAnchor="middle" className="text-sm font-semibold" fill="#111827">
                          {formatCurrency(received + paid)}
                        </text>
                      </g>
                    </svg>

                      <div className="flex flex-col gap-3">
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

                    {/* Right column: bank balances */}
                    <div className="md:w-1/3 md:pl-6 md:border-l md:border-secondary-200">
                      <div className="text-sm font-medium text-secondary-600 mb-2">Saldos por Conta</div>
                      <div>
                        <div className="space-y-2 max-h-44 overflow-auto pr-2">
                          {financeBanks && financeBanks.length > 0 ? (
                            financeBanks.map((b: any) => (
                              <div key={b.id} className="text-sm text-secondary-800">
                                <div className="font-medium truncate">{b.name}</div>
                                <div className="text-xs text-secondary-500">ID: {b.id} — {formatCurrency(Number(b.balance ?? 0))}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-secondary-500">Nenhuma conta encontrada</div>
                          )}
                        </div>

                        {/* Total balance */}
                        <div className="mt-3 pt-3 border-t border-secondary-200">
                          <div className="text-sm text-secondary-600">Total em Bancos</div>
                          <div className="text-lg font-semibold text-secondary-900">
                            {formatCurrency(
                              (financeBanks || []).reduce((s: number, b: any) => s + Number(b.balance ?? 0), 0)
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

        {/* Resumo das movimentações (igual à sessão de baixo) */}
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
            <p className="text-2xl font-semibold text-secondary-900">{extratoDiario.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Banco</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Descrição</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Usuário</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {extratoDiario.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Nenhuma movimentação</td>
                  </tr>
                ) : (
                  extratoDiario.map((it: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(it.dataRegistroMovimentacao || it.data)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(it.conta && (it.conta.fkBanco?.nomeBanco || it.conta.nomeBanco)) || it.nomeBanco || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{it.descricao || it.descricaoPagar || it.descricaoReceber || it.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{it.tipoDuplicata === 0 || it.tipo === 'pagar' ? 'Pagar' : 'Receber'}</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${it.tipoDuplicata === 0 || it.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(Number(it.valor || it.valorMov || it.amount || 0))}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{it.usuario || it.usuarioCad || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Conta (ID)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {extratoPeriodo.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Nenhuma movimentação para o período</td>
                  </tr>
                ) : (
                  extratoPeriodo.map((it: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(it.dataRegistroMovimentacao || it.data)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{it.usuario || it.usuarioCad || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(it.conta && it.conta.idConta) || it.idConta || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{it.tipoDuplicata === 0 || it.tipo === 'pagar' ? 'Pagar' : 'Receber'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">{formatCurrency(Number(it.valor || it.valorMov || it.amount || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Movimentações Bancárias (moved from BankTransactions) */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Movimentações Bancárias</h3>
            <p className="text-sm text-secondary-600">Resumo e histórico de transações</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={txSearchTerm}
              onChange={(e) => setTxSearchTerm(e.target.value)}
              className="input-field"
            />
            <select value={txFilterBank} onChange={e => setTxFilterBank(e.target.value)} className="input-field">
              <option value="">Todos os bancos</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={txFilterType} onChange={e => setTxFilterType(e.target.value as any)} className="input-field">
              <option value="all">Todos os tipos</option>
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
            </select>
          </div>
        </div>

        {/* Resumo removido daqui (movido para a seção superior) */}

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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-secondary-500">Nenhuma transação encontrada</td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-secondary-50">
                    <td className="table-cell">{formatDate(tx.date)}</td>
                    <td className="table-cell">{(tx.bankId && banks.find(b => b.id === tx.bankId)?.name) || '-'}</td>
                    <td className="table-cell">{tx.description}</td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                    </td>
                    <td className={`table-cell text-right font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                    <td className="table-cell">{currentUser?.name || 'Usuário'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
