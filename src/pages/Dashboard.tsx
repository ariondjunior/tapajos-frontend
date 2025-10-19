import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users
} from 'lucide-react';
import { reportService } from '../services';
import { DashboardData } from '../types';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await reportService.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Visão geral do sistema financeiro</p>
        </div>
        <div className="text-sm text-secondary-500">
          Atualizado em {formatDate(new Date())}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Contas a Receber</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {formatCurrency(dashboardData.totalReceivables)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Contas a Pagar</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {formatCurrency(dashboardData.totalPayables)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Bancos</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {formatCurrency(dashboardData.bankBalances.reduce((sum, bank) => sum + bank.balance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Saldo Líquido</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {formatCurrency(dashboardData.totalReceivables - dashboardData.totalPayables)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saldos dos bancos */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Saldos dos Bancos</h3>
        <div className="space-y-3">
          {dashboardData.bankBalances.map((bank, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-secondary-400 mr-3" />
                <span className="font-medium text-secondary-900">{bank.bankName}</span>
              </div>
              <span className={`font-semibold ${
                bank.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(bank.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Previsão de caixa */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Previsão de Caixa (7 dias)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-right">Entradas</th>
                <th className="px-6 py-3 text-right">Saídas</th>
                <th className="px-6 py-3 text-right">Fluxo Líquido</th>
                <th className="px-6 py-3 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {dashboardData.cashFlowProjection.map((projection, index) => (
                <tr key={index}>
                  <td className="table-cell">{formatDate(projection.date)}</td>
                  <td className="table-cell text-right text-green-600">
                    {formatCurrency(projection.totalInflow)}
                  </td>
                  <td className="table-cell text-right text-red-600">
                    {formatCurrency(projection.totalOutflow)}
                  </td>
                  <td className={`table-cell text-right font-medium ${
                    projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {projection.netFlow >= 0 ? (
                      <span className="flex items-center justify-end">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        {formatCurrency(projection.netFlow)}
                      </span>
                    ) : (
                      <span className="flex items-center justify-end">
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                        {formatCurrency(projection.netFlow)}
                      </span>
                    )}
                  </td>
                  <td className={`table-cell text-right font-semibold ${
                    projection.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projection.cumulativeBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transações recentes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Transações Recentes</h3>
        <div className="space-y-3">
          {dashboardData.recentTransactions.length === 0 ? (
            <p className="text-secondary-500 text-center py-4">Nenhuma transação encontrada</p>
          ) : (
            dashboardData.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                    transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{transaction.description}</p>
                    <p className="text-sm text-secondary-500">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
