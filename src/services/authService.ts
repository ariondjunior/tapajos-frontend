import axios from 'axios';
import { LoginCredentials, AuthResponse, User } from '../types';

// Configuração base do axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

// Mock de usuários para demonstração
const mockUsers: User[] = [
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

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar credenciais mockadas
    const user = mockUsers.find(u => 
      u.email === credentials.email && 
      credentials.password === '123456' // Senha fixa para demonstração
    );
    
    if (!user) {
      throw new Error('Email ou senha incorretos');
    }
    
    if (!user.isActive) {
      throw new Error('Usuário inativo');
    }
    
    // Gerar token mockado
    const token = `mock_token_${user.id}_${Date.now()}`;
    const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;
    
    return {
      user,
      token,
      refreshToken
    };
  },

  async logout(): Promise<void> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Logout realizado');
  },

  async refreshToken(): Promise<AuthResponse> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }
    
    // Em uma implementação real, você validaria o refresh token
    const user = mockUsers[0]; // Usar o primeiro usuário como exemplo
    const newToken = `mock_token_${user.id}_${Date.now()}`;
    const newRefreshToken = `mock_refresh_${user.id}_${Date.now()}`;
    
    return {
      user,
      token: newToken,
      refreshToken: newRefreshToken
    };
  },

  async getCurrentUser(): Promise<User> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    // Em uma implementação real, você validaria o token
    return mockUsers[0]; // Retornar o primeiro usuário como exemplo
  },
};

export { api };