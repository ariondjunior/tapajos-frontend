import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { userService } from '../services';
import { ClientSupplier, User } from '../types';
import api from '../services/api';
import axios from 'axios';

type EmpresaApi = {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia: string;
  tipoEmpresa: number; 
  cpfCnpj: string;
  tipoPessoa: number;
  email: string;
  telefone: string;
  ruaEmpresa: string;
  numeroEmpresa: number;
  bairroEmpresa: string;
  cepEmpresa: string;
  estadoEmpresa: string;
  paisEmpresa: string;
  cidadeEmpresa?: string;
};

type PaginatedResponse<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
};

const ClientsSuppliers: React.FC = () => {
  const [clientsSuppliers, setClientsSuppliers] = useState<ClientSupplier[]>([]);
  const [filteredData, setFilteredData] = useState<ClientSupplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'supplier' | 'both'>('all'); 
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientSupplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await userService.getCurrentUser();
        if (mounted) setCurrentUser(u);
      } catch (err) {
        console.error('Erro ao obter usuário atual:', err);
      }
    })();
    return () => { mounted = false };
  }, []);


  const toTypeCorporate = (v: number): 'client' | 'supplier' | 'both' => {
    if (v === 1) return 'supplier';
    if (v === 2) return 'both';     
    return 'client';             
  };

  const toTypePerson = (v: number): 'individual' | 'company' => {
    return v === 1 ? 'company' : 'individual';
  };

  const mapEmpresaToClientSupplier = (e: EmpresaApi): ClientSupplier => ({
    id: String(e.idEmpresa),
    tradeName: e.nomeFantasia,
    corporateName: e.razaoSocial,
    typeCorporate: toTypeCorporate(e.tipoEmpresa),
    typePerson: toTypePerson(e.tipoPessoa),
    document: e.cpfCnpj,
    email: e.email,
    phone: e.telefone,
    street: e.ruaEmpresa,
    number: e.numeroEmpresa,
    district: e.bairroEmpresa,
    city: e.cidadeEmpresa ?? '',
    state: e.estadoEmpresa,
    country: e.paisEmpresa,
    zipCode: e.cepEmpresa,
    createdAt: new Date(),
    isActive: true,
  });

  const handleSearch = async (page: number = 0) => {
    setLoading(true);
    try {
      const pageNum = Number(page);
      
      console.log('Buscando com params:', { page: pageNum, size: pageSize });
      
      const res = await api.get<PaginatedResponse<EmpresaApi>>('/empresa', {
        params: {
          page: pageNum,
          size: pageSize,
        }
      });
      
      console.log('Resposta completa da API:', res);
      console.log('res.data:', res.data);

      const empresas = res.data.content || [];
      console.log('Empresas extraídas:', empresas);
      
      const mapped = empresas.map(mapEmpresaToClientSupplier);
      console.log('Empresas mapeadas:', mapped);
      
      setClientsSuppliers(mapped);
      setCurrentPage(res.data.number);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      if (axios.isAxiosError(err)) {
        console.error('Detalhes do erro:', err.response?.data);
        alert(`Erro ao buscar empresas: ${err.response?.data?.message || err.message}`);
      } else {
        alert('Erro ao buscar empresas');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(0);
  }, []);

  useEffect(() => {
    filterData();
  }, [clientsSuppliers, searchTerm, filterType]);


  const filterData = () => {
    let filtered = clientsSuppliers.filter(item => item.isActive);

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.typeCorporate === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.corporateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.document.includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: ClientSupplier) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      alert('ID inválido para exclusão.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await api.delete(`/empresa/${id}`, {
          params: { userId },
        });
        alert('Item excluído com sucesso');
        handleSearch(); 
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir item');
      }
    }
  };

  const formatDocument = (document: string) => {
    if (document.length === 11) {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (document.length === 14) {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return document;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      handleSearch(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      handleSearch(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  const handleSearchClick = () => {
    handleSearch(0);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clientes e Fornecedores</h1>
          <p className="text-secondary-600">Gerencie o cadastro de clientes e fornecedores</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Cadastro
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar por nome, documento ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'client' | 'supplier' | 'both')}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="client">Clientes</option>
              <option value="supplier">Fornecedores</option>
              <option value="both">Ambos</option>
            </select>
          </div>
          <div>
            <button onClick={handleSearchClick} className="btn-primary w-full sm:w-auto">
              Pesquisar
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">ID Usuário</th>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">Documento</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Telefone</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Data Cadastro</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center text-secondary-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="table-cell">{item.id}</td>
                    <td className="table-cell font-medium">{item.corporateName}</td>
                    <td className="table-cell">{formatDocument(item.document)}</td>
                    <td className="table-cell">{item.email}</td>
                    <td className="table-cell">{item.phone}</td>
                    <td className="table-cell">
                      {(() => {
                        const raw = String(item.typeCorporate ?? '').toUpperCase();
                        const isClient = raw === 'CLIENT' || raw === 'CLIENTE';
                        const isSupplier = raw === 'SUPPLIER' || raw === 'FORNECEDOR';
                        const isBoth = raw === 'BOTH' || raw === 'AMBOS';

                        const badge =
                          isClient
                            ? { label: 'Cliente', cls: 'bg-blue-100 text-blue-800' }
                            : isSupplier
                            ? { label: 'Fornecedor', cls: 'bg-green-100 text-green-800' }
                            : isBoth
                            ? { label: 'Ambos', cls: 'bg-purple-100 text-purple-800' }
                            : { label: '—', cls: 'bg-gray-100 text-gray-800' };

                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="table-cell">{formatDate(item.createdAt)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-secondary-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary-700">
                Mostrando <span className="font-medium">{currentPage * pageSize + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * pageSize, totalElements)}
                </span>{' '}
                de <span className="font-medium">{totalElements}</span> resultados
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-secondary-300 text-secondary-500 hover:bg-secondary-50'
                    }`}
                  >
                    {page + 1}
                  </button>
                ))}
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próxima</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ClientSupplierModal
          item={editingItem}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            handleSearch(); 
          }}
        />
      )}
    </div>
  );
};

interface ClientSupplierModalProps {
  item: ClientSupplier | null;
  onClose: () => void;
  onSave: () => void;
  currentUser?: User | null;
}

const ClientSupplierModal: React.FC<ClientSupplierModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tradeName: '',
    corporateName: '',
    typeCorporate: 'CLIENTE' as 'CLIENTE' | 'FORNECEDOR' | 'AMBOS',
    typePerson: 'individual' as 'individual' | 'company',
    document: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    city: '',
    district: '',
    state: '',
    zipCode: '',
    country: '',
    isActive: true,
  });


  useEffect(() => {
    if (item) {
      setFormData({
        tradeName: item.tradeName,
        corporateName: item.corporateName,
        typeCorporate: toTipoEmpresa(item.typeCorporate),
        typePerson: item.typePerson,
        document: item.document,
        email: item.email,
        phone: item.phone,
        street: item.street,
        number: String(item.number ?? ''),
        district: item.district,
        city: item.city,
        state: item.state,
        country: item.country,
        zipCode: item.zipCode,
        isActive: item.isActive
      });
    }
  }, [item]);

  const onlyDigits = (v: string) => String(v ?? '').replace(/\D/g, '');
  const toInt = (v: string) => {
    const d = onlyDigits(v);
    return d ? parseInt(d, 10) : null;
  };
  
  const toTipoEmpresaNumero = (v: string): number => {
    const s = String(v ?? '').toUpperCase();
    if (s === 'FORNECEDOR') return 1;
    if (s === 'AMBOS') return 2;
    return 0; 
  };
  
  const toTipoPessoaNumero = (v: string): number => {
    const s = String(v ?? '').toUpperCase();
    if (s === 'COMPANY' || s === 'JURIDICA') return 1;
    return 0; 
  };

  const toTipoEmpresa = (v: string | number): 'CLIENTE' | 'FORNECEDOR' | 'AMBOS' => {
    if (typeof v === 'number') {
      if (v === 1) return 'FORNECEDOR';
      if (v === 2) return 'AMBOS';
      return 'CLIENTE';
    }
    const s = String(v ?? '').toUpperCase();
    if (s === 'SUPPLIER' || s === 'FORNECEDOR') return 'FORNECEDOR';
    if (s === 'BOTH' || s === 'AMBOS') return 'AMBOS';
    return 'CLIENTE';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...(item ? { idEmpresa: Number(item.id) } : {}),
      razaoSocial: formData.corporateName,
      nomeFantasia: formData.tradeName,
      tipoEmpresa: toTipoEmpresaNumero(formData.typeCorporate), 
      cpfCnpj: onlyDigits(formData.document),
      tipoPessoa: toTipoPessoaNumero(formData.typePerson),
      email: formData.email || '',
      telefone: onlyDigits(formData.phone) || '',
      ruaEmpresa: formData.street || '',
      numeroEmpresa: toInt(formData.number) ?? 0,
      bairroEmpresa: formData.district || '',
      cepEmpresa: onlyDigits(formData.zipCode) || '',
      estadoEmpresa: formData.state || '',
      paisEmpresa: formData.country || '',
      cidadeEmpresa: formData.city || '',
    };

    try {
      if (item) {
        await api.put(`/empresa/${item.id}`, payload);
      } else {
        console.log('Payload enviado:', payload);
        await api.post('/empresa', payload);
      }
      alert('Dados salvos com sucesso!');
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 500) {
          alert('CPF/CNPJ ou e-mail já cadastrado');
          return;
        }

        const data = error.response?.data;
        const msg = typeof data === 'string' ? data : data?.message ?? error.message ?? 'Erro desconhecido';
        alert(`Erro ao salvar dados: ${msg}`);
        return;
      }

      alert('Erro ao salvar dados');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {item ? `Editar ${formData.typeCorporate === 'CLIENTE' ? 'Cliente' : formData.typeCorporate === 'FORNECEDOR' ? 'Fornecedor' : 'Ambos'}` : 'Novo cadastro'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.typeCorporate}
                    onChange={(e) => setFormData({ ...formData, typeCorporate: e.target.value as 'CLIENTE' | 'FORNECEDOR' | 'AMBOS' })}
                    className="input-field"
                    required
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome fantasia*
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razão social*
                  </label>
                  <input
                    type="text"
                    value={formData.corporateName}
                    onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento (CPF/CNPJ) *
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input-field"
                    placeholder="00000-000"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua *
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={formData.number}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, number: digitsOnly });
                      }}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input-field"
                      placeholder="UF"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input-field"
                    placeholder="Brasil"
                    required
                  />
                </div>
              </div>
            </div>


            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                {item ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
};

export default ClientsSuppliers;
