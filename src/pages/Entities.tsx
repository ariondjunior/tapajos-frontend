import { useState } from 'react'
import { useFinance } from '../context/finance'

export default function Entities(){
  const { entities, addEntity } = useFinance()
  const [name, setName] = useState('')
  const [isClient, setIsClient] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setIsSubmitting(true)
    try {
      addEntity({ name: name.trim(), isClient })
      setName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entidades</h1>
          <p className="text-gray-600">Gerencie clientes e fornecedores do seu negócio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Nova Entidade</h2>
                <p className="text-gray-600 text-sm">Adicione um novo cliente ou fornecedor</p>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Entidade
                  </label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                    placeholder="Digite o nome completo"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Entidade
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="entityType"
                        checked={isClient} 
                        onChange={() => setIsClient(true)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-gray-900">Cliente</span>
                        </div>
                        <p className="text-sm text-gray-500">Pessoa ou empresa que compra seus produtos/serviços</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="entityType"
                        checked={!isClient} 
                        onChange={() => setIsClient(false)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium text-gray-900">Fornecedor</span>
                        </div>
                        <p className="text-sm text-gray-500">Pessoa ou empresa que fornece produtos/serviços para você</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !name.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Adicionar Entidade
                    </>
                  )}
                </button>
      </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Entidades Cadastradas</h2>
                  <p className="text-gray-600 text-sm mt-1">{entities.length} entidades cadastradas</p>
                </div>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {entities.filter(e => e.isClient).length} Clientes
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {entities.filter(e => !e.isClient).length} Fornecedores
                  </span>
                </div>
              </div>

              {entities.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma entidade cadastrada</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece adicionando sua primeira entidade.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entities.map((entity, index) => (
                    <div 
                      key={entity.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                          entity.isClient ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <svg className={`w-5 h-5 ${entity.isClient ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {entity.isClient ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{entity.name}</h3>
                          <p className="text-sm text-gray-500">
                            {entity.isClient ? 'Cliente' : 'Fornecedor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entity.isClient 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entity.isClient ? 'Cliente' : 'Fornecedor'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
