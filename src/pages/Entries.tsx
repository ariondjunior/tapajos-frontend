import { useState } from 'react'
import { useFinance } from '../context/finance'
import { useAuth } from '../context/auth'

export default function Entries(){
  const { entities, banks, entries, addEntry, payEntry } = useFinance()
  const { user } = useAuth()
  const [type, setType] = useState<'receivable'|'payable'>('receivable')
  const [entityId, setEntityId] = useState<string>('')
  const [bankId, setBankId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !user) return
    
    setIsSubmitting(true)
    try {
      addEntry({ 
        user: user.username, 
        entityId: entityId || undefined, 
        bankId: bankId || undefined, 
        type, 
        description: desc, 
        amount: Number(amount), 
        paid: false 
      })
      setAmount('')
      setDesc('')
      setEntityId('')
      setBankId('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEntityName = (id?: string) => {
    const entity = entities.find(e => e.id === id)
    return entity?.name || 'Não informado'
  }

  const getBankName = (id?: string) => {
    const bank = banks.find(b => b.id === id)
    return bank?.name || 'Não informado'
  }

  const nonBankEntries = entries.filter(e => e.type !== 'bank')
  const pendingEntries = nonBankEntries.filter(e => !e.paid)
  const paidEntries = nonBankEntries.filter(e => e.paid)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançamentos</h1>
          <p className="text-gray-600">Gerencie suas transações financeiras</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Novo Lançamento</h2>
                <p className="text-gray-600 text-sm">Registre uma nova transação</p>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Tipo de Transação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Transação
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="transactionType"
                        checked={type === 'receivable'} 
                        onChange={() => setType('receivable')}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-medium text-gray-900">A Receber</span>
                        </div>
                        <p className="text-sm text-gray-500">Dinheiro que você vai receber</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="transactionType"
                        checked={type === 'payable'} 
                        onChange={() => setType('payable')}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-medium text-gray-900">A Pagar</span>
                        </div>
                        <p className="text-sm text-gray-500">Dinheiro que você vai pagar</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Entidade */}
        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entidade
                  </label>
                  <select 
                    value={entityId} 
                    onChange={e => setEntityId(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Selecione uma entidade</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.isClient ? 'Cliente' : 'Fornecedor'})
                      </option>
                    ))}
          </select>
                </div>

                {/* Banco */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco (Opcional)
                  </label>
                  <select 
                    value={bankId} 
                    onChange={e => setBankId(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Selecione um banco</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
          </select>
        </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                    <input 
                      type="number"
                      step="0.01"
                      className="input-field pl-10" 
                      placeholder="0,00"
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Descrição */}
        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                    rows={3}
                    placeholder="Descreva a transação..."
                    value={desc} 
                    onChange={e => setDesc(e.target.value)}
                  />
        </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !amount || !user}
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
                      Adicionar Lançamento
                    </>
                  )}
                </button>
      </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
              <div>
                  <h2 className="text-xl font-semibold text-gray-900">Lançamentos</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {nonBankEntries.length} lançamentos • {pendingEntries.length} pendentes • {paidEntries.length} pagos
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {pendingEntries.length} Pendentes
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {paidEntries.length} Pagos
                  </span>
                </div>
              </div>

              {nonBankEntries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lançamento cadastrado</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece adicionando seu primeiro lançamento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Banco
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nonBankEntries.map((entry, index) => (
                        <tr 
                          key={entry.id} 
                          className="hover:bg-gray-50 transition-colors animate-fadeIn"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                entry.type === 'receivable' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {entry.description || 'Sem descrição'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {entry.type === 'receivable' ? 'A Receber' : 'A Pagar'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getEntityName(entry.entityId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getBankName(entry.bankId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${
                              entry.type === 'receivable' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.type === 'receivable' ? '+' : '-'}{formatCurrency(entry.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.paid ? (
                              <span className="badge-success">Pago</span>
                            ) : (
                              <span className="badge-warning">Pendente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!entry.paid && (
                              <button
                                onClick={() => user && payEntry(entry.id, user.username)}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-xs"
                              >
                                Marcar Pago
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
