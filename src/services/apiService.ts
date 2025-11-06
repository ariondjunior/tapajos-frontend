import axios from 'axios';
import { 
  User, 
  ClientSupplier, 
  Bank, 
  BankTransaction, 
  PayableReceivable, 
  CashFlowProjection,
  UserAudit,
  DashboardData 
} from '../types';

// Configuração base do axios
// Prefer REACT_APP_API_URL (set in .env). Fallback to backend default port 8080 used by the API server.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços para Clientes/Fornecedores
export const clientSupplierService = {
  async getAll(): Promise<ClientSupplier[]> {
    try {
      const response = await api.get('/clients-suppliers');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes/fornecedores:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async getById(id: string): Promise<ClientSupplier> {
    try {
      const response = await api.get(`/clients-suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cliente/fornecedor:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async create(data: Omit<ClientSupplier, 'id' | 'createdAt'>): Promise<ClientSupplier> {
    try {
      const response = await api.post('/clients-suppliers', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente/fornecedor:', error);
      throw new Error('Erro ao salvar dados');
    }
  },
  
  async update(id: string, data: Partial<ClientSupplier>): Promise<ClientSupplier> {
    try {
      const response = await api.put(`/clients-suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar cliente/fornecedor:', error);
      throw new Error('Erro ao atualizar dados');
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/clients-suppliers/${id}`);
    } catch (error) {
      console.error('Erro ao excluir cliente/fornecedor:', error);
      throw new Error('Erro ao excluir dados');
    }
  }
};

// Serviços para Bancos
export const bankService = {
  async getAll(): Promise<Bank[]> {
    try {
      const response = await api.get('/banks');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async getById(id: string): Promise<Bank> {
    try {
      const response = await api.get(`/banks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar banco:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async create(data: Omit<Bank, 'id' | 'createdAt'>): Promise<Bank> {
    try {
      const response = await api.post('/banks', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar banco:', error);
      throw new Error('Erro ao salvar dados');
    }
  },
  
  async update(id: string, data: Partial<Bank>): Promise<Bank> {
    try {
      const response = await api.put(`/banks/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
      throw new Error('Erro ao atualizar dados');
    }
  },
  
  async updateBalance(id: string, amount: number, type: 'credit' | 'debit'): Promise<Bank> {
    try {
      const response = await api.patch(`/banks/${id}/balance`, { amount, type });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      throw new Error('Erro ao atualizar saldo');
    }
  }
};

// Serviços para Transações Bancárias
export const bankTransactionService = {
  async getAll(): Promise<BankTransaction[]> {
    try {
      const response = await api.get('/bank-transactions');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async create(data: Omit<BankTransaction, 'id' | 'createdAt'>): Promise<BankTransaction> {
    try {
      const response = await api.post('/bank-transactions', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Erro ao salvar dados');
    }
  },
  
  async getByBank(bankId: string): Promise<BankTransaction[]> {
    try {
      const response = await api.get(`/bank-transactions?bankId=${bankId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações do banco:', error);
      throw new Error('Erro ao carregar dados');
    }
  }
};

// Serviços para Contas a Pagar/Receber
export const payableReceivableService = {
  async getAll(): Promise<PayableReceivable[]> {
    try {
      const response = await api.get('/payables-receivables');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar duplicatas:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async getByClientSupplier(clientSupplierId: string): Promise<PayableReceivable[]> {
    try {
      const response = await api.get(`/payables-receivables?clientSupplierId=${clientSupplierId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar duplicatas do cliente/fornecedor:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async create(data: Omit<PayableReceivable, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayableReceivable> {
    try {
      const response = await api.post('/payables-receivables', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar duplicata:', error);
      throw new Error('Erro ao salvar dados');
    }
  },
  
  async pay(id: string, paidAmount: number, bankId: string): Promise<PayableReceivable> {
    try {
      const response = await api.patch(`/payables-receivables/${id}/pay`, { paidAmount, bankId });
      return response.data;
    } catch (error) {
      console.error('Erro ao pagar duplicata:', error);
      throw new Error('Erro ao processar pagamento');
    }
  },
  
  async update(id: string, data: Partial<PayableReceivable>): Promise<PayableReceivable> {
    try {
      const response = await api.put(`/payables-receivables/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar duplicata:', error);
      throw new Error('Erro ao atualizar dados');
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/payables-receivables/${id}`);
    } catch (error) {
      console.error('Erro ao excluir duplicata:', error);
      throw new Error('Erro ao excluir dados');
    }
  }
};

// Serviços para Relatórios
export const reportService = {
  async getCashFlowProjection(days: number = 30): Promise<CashFlowProjection[]> {
    try {
      const response = await api.get(`/reports/cash-flow?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar previsão de caixa:', error);
      throw new Error('Erro ao carregar relatório');
    }
  },
  
  async getClientExtract(clientId: string): Promise<PayableReceivable[]> {
    try {
      const response = await api.get(`/reports/client-extract/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar extrato do cliente:', error);
      throw new Error('Erro ao carregar relatório');
    }
  },
  
  async getSupplierExtract(supplierId: string): Promise<PayableReceivable[]> {
    try {
      const response = await api.get(`/reports/supplier-extract/${supplierId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar extrato do fornecedor:', error);
      throw new Error('Erro ao carregar relatório');
    }
  },
  
  async getUserAudit(userId?: string): Promise<UserAudit[]> {
    try {
      const url = userId ? `/reports/user-audit/${userId}` : '/reports/user-audit';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar auditoria:', error);
      throw new Error('Erro ao carregar relatório');
    }
  },
  
  async getBankStatement(bankId?: string): Promise<BankTransaction[]> {
    try {
      const url = bankId ? `/reports/bank-statement/${bankId}` : '/reports/bank-statement';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar extrato bancário:', error);
      throw new Error('Erro ao carregar relatório');
    }
  },
  
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw new Error('Erro ao carregar dados');
    }
  }
};

// Movimentações / Extratos
export const movimentacaoService = {
  async getExtratoDiario(): Promise<any[]> {
    try {
      const url = '/movimentacao/extrato/diario';
      // debug: log full request url
      // eslint-disable-next-line no-console
      console.debug('[movimentacaoService] GET', (api.defaults.baseURL || '') + url);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar extrato diário:', error);
      const err: any = error;
      // if axios error, log request url/response for debugging
      // eslint-disable-next-line no-console
      if (err?.config) console.debug('[movimentacaoService] request config', err.config);
      // eslint-disable-next-line no-console
      if (err?.response) console.debug('[movimentacaoService] response', err.response.status, err.response.data);
      throw new Error('Erro ao carregar extrato diário');
    }
  },

  async getExtratoPeriodo(dataInicio: string, dataFim: string): Promise<any[]> {
    try {
      const url = '/movimentacao/extrato/periodo';
      // debug: log full request url and params
      // eslint-disable-next-line no-console
      console.debug('[movimentacaoService] GET', (api.defaults.baseURL || '') + url, { dataInicio, dataFim });
      const response = await api.get(url, { params: { dataInicio, dataFim } });
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar extrato por período:', error);
      const err: any = error;
      // eslint-disable-next-line no-console
      if (err?.config) console.debug('[movimentacaoService] request config', err.config);
      // eslint-disable-next-line no-console
      if (err?.response) console.debug('[movimentacaoService] response', err.response.status, err.response.data);
      throw new Error('Erro ao carregar extrato por período');
    }
  }
  ,

  async getMovimentacoes(page: number = 0, pageSize: number = 100): Promise<any> {
    try {
      const url = '/movimentacao';
      // eslint-disable-next-line no-console
      console.debug('[movimentacaoService] GET', (api.defaults.baseURL || '') + url, { page, pageSize });
      const response = await api.get(url, { params: { page, pageSize } });
      return response.data;
    } catch (error) {
      const err: any = error;
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar movimentações:', err);
      // eslint-disable-next-line no-console
      if (err?.response) console.debug('[movimentacaoService] response', err.response.status, err.response.data);
      throw new Error('Erro ao carregar movimentações');
    }
  }
};

// Serviços para Usuários
export const userService = {
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      throw new Error('Erro ao carregar dados do usuário');
    }
  },
  
  async getAll(): Promise<User[]> {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Erro ao carregar dados');
    }
  },
  
  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const response = await api.post('/users', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error('Erro ao salvar dados');
    }
  },
  
  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Erro ao atualizar dados');
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error('Erro ao excluir dados');
    }
  }
};

export { api };
