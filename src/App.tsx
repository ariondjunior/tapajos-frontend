import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ClientsSuppliers from './pages/ClientsSuppliers';
import Banks from './pages/Banks';
import Payables from './pages/Payables';
import Receivables from './pages/Receivables';
import Reports from './pages/Reports';
import { Home, Users as UsersIcon, Building2, FileText, TrendingUp, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen bg-secondary-50">
            <aside className="w-64 bg-white border-r border-secondary-200">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-secondary-200">
                  <h1 className="text-2xl font-bold text-primary-600">Sistema Tapajós</h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">

                  <Link
                    to="/entities"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/entities' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Clientes/Fornecedores
                  </Link>
                  <Link
                    to="/banks"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/banks' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 mr-3" />
                    Bancos
                  </Link>
                  <Link
                    to="/payables"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/payables' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    Contas a Pagar
                  </Link>
                  <Link
                    to="/receivables"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/receivables' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    Contas a Receber
                  </Link>
                  <Link
                    to="/reports"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/reports' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5 mr-3" />
                    Relatórios
                  </Link>
                </nav>

                <div className="p-4 border-t border-secondary-200">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-secondary-900">{user?.name ?? 'Usuário'}</p>
                      <p className="text-xs text-secondary-500">{user?.role ?? 'Usuário Teste'}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/login';
                      }}
                      className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                      title="Sair"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route path="/" element={<Reports />} />
                  <Route path="/entities" element={<ClientsSuppliers />} />
                  <Route path="/banks" element={<Banks />} />
                  <Route path="/payables" element={<Payables />} />
                  <Route path="/receivables" element={<Receivables />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </div>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
