import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, Building2, FileText, BarChart3 } from 'lucide-react';
import { reportService, clientSupplierService, bankService } from '../services';
import { CashFlowProjection, PayableReceivable, BankTransaction, ClientSupplier, Bank } from '../types';

const Reports: React.FC = () => {
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [clientExtract, setClientExtract] = useState<PayableReceivable[]>([]);
  const [supplierExtract, setSupplierExtract] = useState<PayableReceivable[]>([]);
  const [bankStatement, setBankStatement] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientSuppliers, setClientSuppliers] = useState<ClientSupplier[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientsData, banksData] = await Promise.all([
          clientSupplierService.getAll(),
          bankService.getAll()
        ]);
        setClientSuppliers(clientsData);
        setBanks(banksData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    loadInitialData();
    loadCashFlowProjection();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientExtract();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierExtract();
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (selectedBank) {
      loadBankStatement();
    }
  }, [selectedBank]);

  const loadCashFlowProjection = async () => {
    try {
      const data = await reportService.getCashFlowProjection(30);
      setCashFlowProjection(data);
    } catch (error) {
      console.error('Erro ao carregar previsão de caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientExtract = async () => {
    try {
      const data = await reportService.getClientExtract(selectedClient);
      setClientExtract(data);
    } catch (error) {
      console.error('Erro ao carregar extrato do cliente:', error);
    }
  };

  const loadSupplierExtract = async () => {
    try {
      const data = await reportService.getSupplierExtract(selectedSupplier);
      setSupplierExtract(data);
    } catch (error) {
      console.error('Erro ao carregar extrato do fornecedor:', error);
    }
  };

  const loadBankStatement = async () => {
    try {
      const data = await reportService.getBankStatement(selectedBank);
      setBankStatement(data);
    } catch (error) {
      console.error('Erro ao carregar extrato bancário:', error);
    }
  };

  const getClientSupplierName = (id: string) => {
    const clientSupplier = clientSuppliers.find(cs => cs.id === id);
    return clientSupplier ? clientSupplier.name : 'Não encontrado';
  };

  const getBankName = (id: string) => {
    const bank = banks.find(b => b.id === id);
    return bank ? bank.name : 'Não encontrado';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="text-2xl font-bold text-secondary-900">Relatórios Gerenciais</h1>
          <p className="text-secondary-600">Visualize e exporte relatórios do sistema</p>
        </div>
      </div>

      {/* Previsão de Caixa */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Previsão de Caixa (30 dias)
          </h3>
          <button
            onClick={() => exportToCSV(cashFlowProjection, 'previsao-caixa')}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
        </div>
        
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
              {cashFlowProjection.map((projection, index) => (
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
                    {formatCurrency(projection.netFlow)}
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

      {/* Extrato Cliente */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Extrato por Cliente
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="input-field w-64"
            >
              <option value="">Selecione um cliente</option>
              {clientSuppliers
                .filter(cs => cs.type === 'client')
                .map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            {selectedClient && (
              <button
                onClick={() => exportToCSV(clientExtract, `extrato-cliente-${selectedClient}`)}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            )}
          </div>
        </div>

        {selectedClient ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Descrição</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-left">Vencimento</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {clientExtract.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-secondary-500">
                      Nenhuma duplicata encontrada para este cliente
                    </td>
                  </tr>
                ) : (
                  clientExtract.map((item: any) => (
                    <tr key={item.id}>
                      <td className="table-cell">{item.description}</td>
                      <td className="table-cell text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="table-cell">{formatDate(item.dueDate)}</td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary-500 text-center py-8">
            Selecione um cliente para visualizar o extrato
          </p>
        )}
      </div>

      {/* Extrato Fornecedor */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Extrato por Fornecedor
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="input-field w-64"
            >
              <option value="">Selecione um fornecedor</option>
              {clientSuppliers
                .filter(cs => cs.type === 'supplier')
                .map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            {selectedSupplier && (
              <button
                onClick={() => exportToCSV(supplierExtract, `extrato-fornecedor-${selectedSupplier}`)}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            )}
          </div>
        </div>

        {selectedSupplier ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Descrição</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-left">Vencimento</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {supplierExtract.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-secondary-500">
                      Nenhuma duplicata encontrada para este fornecedor
                    </td>
                  </tr>
                ) : (
                  supplierExtract.map((item: any) => (
                    <tr key={item.id}>
                      <td className="table-cell">{item.description}</td>
                      <td className="table-cell text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="table-cell">{formatDate(item.dueDate)}</td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary-500 text-center py-8">
            Selecione um fornecedor para visualizar o extrato
          </p>
        )}
      </div>

      {/* Extrato Bancário */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Extrato Bancário
          </h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="input-field w-64"
            >
              <option value="">Selecione um banco</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
            {selectedBank && (
              <button
                onClick={() => exportToCSV(bankStatement, `extrato-bancario-${selectedBank}`)}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            )}
          </div>
        </div>

        {selectedBank ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-left">Descrição</th>
                  <th className="px-6 py-3 text-center">Tipo</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {bankStatement.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-secondary-500">
                      Nenhuma transação encontrada para este banco
                    </td>
                  </tr>
                ) : (
                  bankStatement.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td className="table-cell">{formatDate(transaction.date)}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary-500 text-center py-8">
            Selecione um banco para visualizar o extrato
          </p>
        )}
      </div>
    </div>
  );
};

export default Reports;
