// using automatic JSX runtime
import { Link } from 'react-router-dom'
import { useFinance } from '../context/finance'
import { useAuth } from '../context/auth'

export default function Home(){
  const { entities, banks, entries } = useFinance()
  const { user } = useAuth()

  // Estatísticas calculadas
  const totalBanks = banks.length
  const totalBalance = banks.reduce((sum, bank) => sum + bank.balance, 0)
  const totalEntities = entities.length
  const totalEntries = entries.length
  const pendingEntries = entries.filter(e => !e.paid && e.type !== 'bank').length
  const paidEntries = entries.filter(e => e.paid && e.type !== 'bank').length

  const quickActions = [
    {
      title: 'Gerenciar Entidades',
      description: 'Clientes e Fornecedores',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      link: '/entities',
      color: 'blue'
    },
    {
      title: 'Contas Bancárias',
      description: 'Gerenciar bancos e saldos',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      link: '/banks',
      color: 'green'
    },
    {
      title: 'Novo Lançamento',
      description: 'Registrar transação',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      link: '/reports',
      color: 'purple'
    },
    {
      title: 'Relatórios',
      description: 'Análises e relatórios',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      link: '/reports',
      color: 'orange'
    }
  ]

  const stats = [
    {
      title: 'Saldo Total',
      value: `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      color: 'green'
    },
    {
      title: 'Contas Bancárias',
      value: totalBanks.toString(),
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      color: 'blue'
    },
    {
      title: 'Entidades',
      value: totalEntities.toString(),
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'purple'
    },
    {
      title: 'Lançamentos Pendentes',
      value: pendingEntries.toString(),
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'orange'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Gerencie suas finanças de forma eficiente e profissional
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <svg className={`w-6 h-6 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
                style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-${action.color}-100`}>
                    <svg className={`w-6 h-6 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Entries */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Lançamentos Recentes</h3>
              <Link to="/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-4">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${entry.paid ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.description || 'Sem descrição'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString('pt-BR')} • {entry.user}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${entry.paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {entry.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Balances */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Saldos Bancários</h3>
              <Link to="/banks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Gerenciar
              </Link>
            </div>
            <div className="space-y-4">
              {banks.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                      <p className="text-xs text-gray-500">Conta corrente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      R$ {bank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bank.balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
