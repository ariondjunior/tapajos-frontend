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

// Mock data para demonstração
let mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@tapajos.com',
    role: 'admin',
    createdAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    name: 'Usuário Teste',
    email: 'user@tapajos.com',
    role: 'user',
    createdAt: new Date(),
    isActive: true
  }
];

let mockClientSuppliers: ClientSupplier[] = [
  {
    id: '1',
    name: 'Cliente Exemplo Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@cliente.com',
    phone: '(11) 99999-9999',
    address: 'Rua Exemplo, 123',
    type: 'client',
    createdAt: new Date(),
    createdBy: '1',
    isActive: true
  },
  {
    id: '2',
    name: 'Fornecedor ABC S/A',
    document: '98.765.432/0001-10',
    email: 'vendas@fornecedor.com',
    phone: '(11) 88888-8888',
    address: 'Av. Fornecedor, 456',
    type: 'supplier',
    createdAt: new Date(),
    createdBy: '1',
    isActive: true
  }
];

let mockBanks: Bank[] = [
  {
    id: '1',
    name: 'Banco do Brasil',
    code: '001',
    accountNumber: '12345-6',
    agency: '1234',
    currentBalance: 50000,
    createdAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    name: 'Caixa Econômica Federal',
    code: '104',
    accountNumber: '67890-1',
    agency: '5678',
    currentBalance: 25000,
    createdAt: new Date(),
    isActive: true
  }
];

let mockBankTransactions: BankTransaction[] = [
  {
    id: '1',
    bankId: '1',
    type: 'credit',
    amount: 5000,
    description: 'Depósito inicial',
    date: new Date(),
    userId: '1',
    createdAt: new Date()
  },
  {
    id: '2',
    bankId: '1',
    type: 'debit',
    amount: 1000,
    description: 'Pagamento fornecedor',
    date: new Date(),
    userId: '1',
    createdAt: new Date()
  }
];

let mockPayablesReceivables: PayableReceivable[] = [
  {
    id: '1',
    clientSupplierId: '1',
    type: 'receivable',
    amount: 3000,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    description: 'Serviços prestados',
    status: 'pending',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    clientSupplierId: '2',
    type: 'payable',
    amount: 1500,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
    description: 'Compra de materiais',
    status: 'pending',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let mockUserAudits: UserAudit[] = [
  {
    id: '1',
    userId: '1',
    action: 'CREATE',
    entityType: 'ClientSupplier',
    entityId: '1',
    timestamp: new Date(),
    details: 'Criado cliente: Cliente Exemplo Ltda'
  }
];

// Função para simular delay da API
const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Função para gerar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Serviços para Clientes/Fornecedores
export const clientSupplierService = {
  async getAll(): Promise<ClientSupplier[]> {
    await simulateApiDelay();
    return mockClientSuppliers.filter(cs => cs.isActive);
  },
  
  async getById(id: string): Promise<ClientSupplier> {
    await simulateApiDelay();
    const clientSupplier = mockClientSuppliers.find(cs => cs.id === id);
    if (!clientSupplier) {
      throw new Error('Cliente/Fornecedor não encontrado');
    }
    return clientSupplier;
  },
  
  async create(data: Omit<ClientSupplier, 'id' | 'createdAt'>): Promise<ClientSupplier> {
    await simulateApiDelay();
    const newClientSupplier: ClientSupplier = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    mockClientSuppliers.push(newClientSupplier);
    
    // Adicionar auditoria
    mockUserAudits.push({
      id: generateId(),
      userId: data.createdBy,
      action: 'CREATE',
      entityType: 'ClientSupplier',
      entityId: newClientSupplier.id,
      timestamp: new Date(),
      details: `Criado ${data.type}: ${data.name}`
    });
    
    return newClientSupplier;
  },
  
  async update(id: string, data: Partial<ClientSupplier>): Promise<ClientSupplier> {
    await simulateApiDelay();
    const index = mockClientSuppliers.findIndex(cs => cs.id === id);
    if (index === -1) {
      throw new Error('Cliente/Fornecedor não encontrado');
    }
    
    mockClientSuppliers[index] = { ...mockClientSuppliers[index], ...data };
    return mockClientSuppliers[index];
  },
  
  async delete(id: string): Promise<void> {
    await simulateApiDelay();
    const index = mockClientSuppliers.findIndex(cs => cs.id === id);
    if (index === -1) {
      throw new Error('Cliente/Fornecedor não encontrado');
    }
    
    mockClientSuppliers[index].isActive = false;
  }
};

// Serviços para Bancos
export const bankService = {
  async getAll(): Promise<Bank[]> {
    await simulateApiDelay();
    return mockBanks.filter(b => b.isActive);
  },
  
  async getById(id: string): Promise<Bank> {
    await simulateApiDelay();
    const bank = mockBanks.find(b => b.id === id);
    if (!bank) {
      throw new Error('Banco não encontrado');
    }
    return bank;
  },
  
  async create(data: Omit<Bank, 'id' | 'createdAt'>): Promise<Bank> {
    await simulateApiDelay();
    const newBank: Bank = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    mockBanks.push(newBank);
    return newBank;
  },
  
  async update(id: string, data: Partial<Bank>): Promise<Bank> {
    await simulateApiDelay();
    const index = mockBanks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Banco não encontrado');
    }
    
    mockBanks[index] = { ...mockBanks[index], ...data };
    return mockBanks[index];
  },
  
  async updateBalance(id: string, amount: number, type: 'credit' | 'debit'): Promise<Bank> {
    await simulateApiDelay();
    const bank = mockBanks.find(b => b.id === id);
    if (!bank) {
      throw new Error('Banco não encontrado');
    }
    
    if (type === 'credit') {
      bank.currentBalance += amount;
    } else {
      bank.currentBalance -= amount;
    }
    
    return bank;
  }
};

// Serviços para Transações Bancárias
export const bankTransactionService = {
  async getAll(): Promise<BankTransaction[]> {
    await simulateApiDelay();
    return mockBankTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  async create(data: Omit<BankTransaction, 'id' | 'createdAt'>): Promise<BankTransaction> {
    await simulateApiDelay();
    const newTransaction: BankTransaction = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    mockBankTransactions.push(newTransaction);
    
    // Atualizar saldo do banco
    await bankService.updateBalance(data.bankId, data.amount, data.type);
    
    return newTransaction;
  },
  
  async getByBank(bankId: string): Promise<BankTransaction[]> {
    await simulateApiDelay();
    return mockBankTransactions
      .filter(t => t.bankId === bankId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

// Serviços para Contas a Pagar/Receber
export const payableReceivableService = {
  async getAll(): Promise<PayableReceivable[]> {
    await simulateApiDelay();
    return mockPayablesReceivables.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  },
  
  async getByClientSupplier(clientSupplierId: string): Promise<PayableReceivable[]> {
    await simulateApiDelay();
    return mockPayablesReceivables.filter(pr => pr.clientSupplierId === clientSupplierId);
  },
  
  async create(data: Omit<PayableReceivable, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayableReceivable> {
    await simulateApiDelay();
    const newPayableReceivable: PayableReceivable = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockPayablesReceivables.push(newPayableReceivable);
    return newPayableReceivable;
  },
  
  async pay(id: string, paidAmount: number, bankId: string): Promise<PayableReceivable> {
    await simulateApiDelay();
    const payableReceivable = mockPayablesReceivables.find(pr => pr.id === id);
    if (!payableReceivable) {
      throw new Error('Duplicata não encontrada');
    }
    
    payableReceivable.status = 'paid';
    payableReceivable.paidDate = new Date();
    payableReceivable.paidAmount = paidAmount;
    payableReceivable.bankId = bankId;
    payableReceivable.updatedAt = new Date();
    
    // Criar transação bancária automaticamente
    const transactionType = payableReceivable.type === 'payable' ? 'debit' : 'credit';
    await bankTransactionService.create({
      bankId,
      type: transactionType,
      amount: paidAmount,
      description: `Pagamento ${payableReceivable.type === 'payable' ? 'duplicata a pagar' : 'duplicata a receber'}`,
      date: new Date(),
      userId: payableReceivable.userId,
      relatedDocumentId: id
    });
    
    return payableReceivable;
  },
  
  async update(id: string, data: Partial<PayableReceivable>): Promise<PayableReceivable> {
    await simulateApiDelay();
    const index = mockPayablesReceivables.findIndex(pr => pr.id === id);
    if (index === -1) {
      throw new Error('Duplicata não encontrada');
    }
    
    mockPayablesReceivables[index] = { 
      ...mockPayablesReceivables[index], 
      ...data,
      updatedAt: new Date()
    };
    return mockPayablesReceivables[index];
  },
  
  async delete(id: string): Promise<void> {
    await simulateApiDelay();
    const index = mockPayablesReceivables.findIndex(pr => pr.id === id);
    if (index === -1) {
      throw new Error('Duplicata não encontrada');
    }
    
    mockPayablesReceivables.splice(index, 1);
  }
};

// Serviços para Relatórios
export const reportService = {
  async getCashFlowProjection(days: number = 30): Promise<CashFlowProjection[]> {
    await simulateApiDelay();
    const projections: CashFlowProjection[] = [];
    const today = new Date();
    let cumulativeBalance = mockBanks.reduce((sum, bank) => sum + bank.currentBalance, 0);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayReceivables = mockPayablesReceivables
        .filter(pr => pr.type === 'receivable' && pr.dueDate.toDateString() === date.toDateString())
        .reduce((sum, pr) => sum + pr.amount, 0);
      
      const dayPayables = mockPayablesReceivables
        .filter(pr => pr.type === 'payable' && pr.dueDate.toDateString() === date.toDateString())
        .reduce((sum, pr) => sum + pr.amount, 0);
      
      const netFlow = dayReceivables - dayPayables;
      cumulativeBalance += netFlow;
      
      projections.push({
        date,
        totalInflow: dayReceivables,
        totalOutflow: dayPayables,
        netFlow,
        cumulativeBalance
      });
    }
    
    return projections;
  },
  
  async getClientExtract(clientId: string): Promise<PayableReceivable[]> {
    await simulateApiDelay();
    return mockPayablesReceivables.filter(pr => 
      pr.clientSupplierId === clientId && pr.type === 'receivable'
    );
  },
  
  async getSupplierExtract(supplierId: string): Promise<PayableReceivable[]> {
    await simulateApiDelay();
    return mockPayablesReceivables.filter(pr => 
      pr.clientSupplierId === supplierId && pr.type === 'payable'
    );
  },
  
  async getUserAudit(userId?: string): Promise<UserAudit[]> {
    await simulateApiDelay();
    if (userId) {
      return mockUserAudits.filter(audit => audit.userId === userId);
    }
    return mockUserAudits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
  
  async getBankStatement(bankId?: string): Promise<BankTransaction[]> {
    await simulateApiDelay();
    if (bankId) {
      return mockBankTransactions.filter(transaction => transaction.bankId === bankId);
    }
    return mockBankTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  async getDashboardData(): Promise<DashboardData> {
    await simulateApiDelay();
    const totalReceivables = mockPayablesReceivables
      .filter(pr => pr.type === 'receivable' && pr.status === 'pending')
      .reduce((sum, pr) => sum + pr.amount, 0);
    
    const totalPayables = mockPayablesReceivables
      .filter(pr => pr.type === 'payable' && pr.status === 'pending')
      .reduce((sum, pr) => sum + pr.amount, 0);
    
    const bankBalances = mockBanks.map(bank => ({
      bankName: bank.name,
      balance: bank.currentBalance
    }));
    
    const cashFlowProjection = await this.getCashFlowProjection(7);
    const recentTransactions = mockBankTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    
    return {
      totalReceivables,
      totalPayables,
      bankBalances,
      cashFlowProjection,
      recentTransactions
    };
  }
};

// Serviços para Usuários
export const userService = {
  async getCurrentUser(): Promise<User> {
    await simulateApiDelay();
    return mockUsers[0]; // Retornar o primeiro usuário como exemplo
  },
  
  async getAll(): Promise<User[]> {
    await simulateApiDelay();
    return mockUsers.filter(u => u.isActive);
  },
  
  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await simulateApiDelay();
    const newUser: User = {
      ...data,
      id: generateId(),
      createdAt: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  },
  
  async update(id: string, data: Partial<User>): Promise<User> {
    await simulateApiDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('Usuário não encontrado');
    }
    
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  },
  
  async delete(id: string): Promise<void> {
    await simulateApiDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('Usuário não encontrado');
    }
    
    mockUsers[index].isActive = false;
  }
};
