
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ClientSupplier {
  id: string;
  tradeName: string;
  corporateName: string;
  typeCorporate: 'client' | 'supplier' | 'both';
  typePerson: 'individual' | 'company';
  document: string; 
  email: string;
  phone: string;
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  accountNumber: string;
  agency: string;
  currentBalance: number;
  createdAt: Date;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  bankId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
  userId: string;
  relatedDocumentId?: string; 
  createdAt: Date;
}

export interface PayableReceivable {
  id: string;
  clientSupplierId: string;
  type: 'payable' | 'receivable';
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
  paidAmount?: number;
  bankId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlowProjection {
  date: Date;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  cumulativeBalance: number;
}

export interface UserAudit {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  details: string;
}

export interface DashboardData {
  totalReceivables: number;
  totalPayables: number;
  bankBalances: Array<{
    bankName: string;
    balance: number;
  }>;
  cashFlowProjection: CashFlowProjection[];
  recentTransactions: BankTransaction[];
}
