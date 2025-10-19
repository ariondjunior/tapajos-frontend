import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsSuppliers from './pages/ClientsSuppliers';
import Banks from './pages/Banks';
import BankTransactions from './pages/BankTransactions';
import PayablesReceivables from './pages/PayablesReceivables';
import Reports from './pages/Reports';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/clients-suppliers" element={
            <ProtectedRoute>
              <Layout>
                <ClientsSuppliers />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/banks" element={
            <ProtectedRoute>
              <Layout>
                <Banks />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/bank-transactions" element={
            <ProtectedRoute>
              <Layout>
                <BankTransactions />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/payables-receivables" element={
            <ProtectedRoute>
              <Layout>
                <PayablesReceivables />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
