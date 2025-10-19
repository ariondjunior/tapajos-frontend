import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { clientSupplierService, userService } from '../services';
import { ClientSupplier } from '../types';
import api from '../services/api';
import axios from 'axios';

// Tipo do payload retornado pela API de /empresa
type EmpresaApi = {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia: string;
  tipoEmpresa: 'CLIENTE' | 'FORNECEDOR' | 'AMBOS';
  cpfCnpj: string;
  tipoPessoa: 'FISICA' | 'JURIDICA';
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

const ClientsSuppliers: React.FC = () => {
  const [clientsSuppliers, setClientsSuppliers] = useState<ClientSupplier[]>([]);
  const [filteredData, setFilteredData] = useState<ClientSupplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'supplier'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientSupplier | null>(null);
  const [loading, setLoading] = useState(false); // inicia como false para não travar a tela

  const currentUser = userService.getCurrentUser();

  // remove o carregamento automático
  // useEffect(() => {
  //   loadData();
  // }, []);

  // Mapeia EmpresaApi -> ClientSupplier (para reutilizar a tabela existente)
  const mapEmpresaToClientSupplier = (e: EmpresaApi): ClientSupplier => ({
    id: String(e.idEmpresa),
    tradeName: e.nomeFantasia,
    corporateName: e.razaoSocial,
    typeCorporate: e.tipoEmpresa === 'FORNECEDOR' ? 'supplier' : 'client',
    typePerson: e.tipoPessoa === 'JURIDICA' ? 'company' : 'individual',
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

  // Busca ao clicar em "Pesquisar"
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get<EmpresaApi[]>('/empresa');
      const mapped = res.data.map(mapEmpresaToClientSupplier);
      setClientsSuppliers(mapped);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      alert('Erro ao buscar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterData();
  }, [clientsSuppliers, searchTerm, filterType]);

  const loadData = async () => {
    try {
      const data = await clientSupplierService.getAll();
      setClientsSuppliers(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await clientSupplierService.delete(id);
        loadData();
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

      {/* Filtros */}
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
              onChange={(e) => setFilterType(e.target.value as 'all' | 'client' | 'supplier')}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="client">Clientes</option>
              <option value="supplier">Fornecedores</option>
            </select>
          </div>
          <div>
            <button onClick={handleSearch} className="btn-primary w-full sm:w-auto">
              Pesquisar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead>
              <tr className="table-header">
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
                  <td colSpan={7} className="table-cell text-center text-secondary-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="table-cell font-medium">{item.corporateName}</td>
                    <td className="table-cell">{formatDocument(item.document)}</td>
                    <td className="table-cell">{item.email}</td>
                    <td className="table-cell">{item.phone}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.typeCorporate === 'client'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {item.typeCorporate === 'client' ? 'Cliente' : 'Fornecedor'}
                      </span>
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
      </div>

      {/* Modal */}
      {showModal && (
        <ClientSupplierModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Modal para criar/editar cliente/fornecedor
interface ClientSupplierModalProps {
  item: ClientSupplier | null;
  onClose: () => void;
  onSave: () => void;
}

const ClientSupplierModal: React.FC<ClientSupplierModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tradeName: '',
    corporateName: '',
    typeCorporate: 'client' as 'client' | 'supplier',
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

  const currentUser = userService.getCurrentUser();

  useEffect(() => {
    if (item) {
      setFormData({
        tradeName: item.tradeName,
        corporateName: item.corporateName,
        typeCorporate: item.typeCorporate,
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
  const toTipoEmpresa = (v: string) => {
    // aceita 'client'/'supplier' ou valores já em PT-BR
    if (v === 'client' || v === 'CLIENTE') return 'CLIENTE';
    if (v === 'supplier' || v === 'FORNECEDOR') return 'FORNECEDOR';
    if (v === 'AMBOS') return 'AMBOS';
    return 'CLIENTE';
  };
  const toTipoPessoa = (v: string) => {
    // 'individual' -> FISICA, 'company' -> JURIDICA
    if (v === 'company' || v === 'JURIDICA') return 'JURIDICA';
    return 'FISICA';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...(item ? { idEmpresa: Number(item.id) } : {}), // envie se necessário no update
      razaoSocial: formData.corporateName,
      nomeFantasia: formData.tradeName,
      tipoEmpresa: toTipoEmpresa(formData.typeCorporate),
      cpfCnpj: onlyDigits(formData.document),
      tipoPessoa: toTipoPessoa(formData.typePerson),
      email: formData.email,
      telefone: onlyDigits(formData.phone),
      ruaEmpresa: formData.street,
      numeroEmpresa: toInt(formData.number),
      bairroEmpresa: formData.district,
      cepEmpresa: onlyDigits(formData.zipCode),
      estadoEmpresa: formData.state,
      paisEmpresa: formData.country,
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
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (axios.isAxiosError(error)) {
        alert(`Erro ao salvar dados: ${error.response?.data?.message || error.message}`);
      } else {
        alert('Erro ao salvar dados');
      }
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
                {item ? `Editar ${formData.typeCorporate === 'client' ? 'Cliente' : 'Fornecedor'}` : 'Novo cadastro'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.typeCorporate}
                    onChange={(e) => setFormData({ ...formData, typeCorporate: e.target.value as 'client' | 'supplier' })}
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
