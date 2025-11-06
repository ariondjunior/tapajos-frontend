import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'

export type Entity = {
  id: string
  name: string
  isClient: boolean
}

export type Bank = {
  id: string
  name: string
  balance: number
}

export type Entry = {
  id: string
  date: string
  user: string
  entityId?: string
  bankId?: string
  type: 'payable' | 'receivable' | 'bank'
  description?: string
  amount: number
  paid?: boolean
}

type FinanceContextType = {
  entities: Entity[]
  banks: Bank[]
  entries: Entry[]
  addEntity: (e: Omit<Entity, 'id'>) => Entity
  addBank: (b: Omit<Bank, 'id'>) => Bank
  addEntry: (e: Omit<Entry, 'id' | 'date'>) => Entry
  payEntry: (id: string, user: string, date?: string) => void
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

function uid(prefix = '') {
  return prefix + Date.now() + Math.random().toString(36).substring(2, 9)
}

// Tipos do backend de /contas (paginado)
type ContaApi = {
  idConta: number
  agencia: string
  conta: string
  saldo: number
  tipoConta: string
  statusConta: number
  dvConta: number
  fkBanco?: {
    idBanco: number
    nomeBanco: string
  }
}

type PaginatedResponse<T> = {
  content: T[]
  totalPages: number
  number: number
  size: number
  totalElements: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export const FinanceProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [entities, setEntities] = useState<Entity[]>(() => [
    { id: 'e1', name: 'Cliente A', isClient: true },
    { id: 'e2', name: 'Fornecedor X', isClient: false },
  ])
  const [banks, setBanks] = useState<Bank[]>(() => [])
  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: 'ent1', date: new Date().toISOString(), user: 'system', entityId: 'e1', bankId: 'b1', type: 'receivable', description: 'Duplicata venda', amount: 1200, paid: false },
  ])

  // Mapeia ContaApi -> Bank
  const mapContaToBank = (c: ContaApi): Bank => ({
    id: String(c.idConta),
    name: `${c.fkBanco?.nomeBanco ?? 'Banco'} • Ag ${c.agencia} Cc ${c.conta}-${c.dvConta}`,
    balance: Number(c.saldo ?? 0),
  })

  // Carrega TODAS as páginas de /contas e consolida
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
  const first = await api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: 0 } })
        let all: ContaApi[] = first.data.content ?? []
        const totalPages = Number(first.data.totalPages ?? 1)

        // Busca páginas restantes (se houver)
        if (totalPages > 1) {
          const promises = [];
          for (let p = 1; p < totalPages; p++) {
            promises.push(api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: p } }))
          }
          const pages = await Promise.all(promises)
          pages.forEach(res => {
            all = all.concat(res.data.content ?? [])
          })
        }

        const mapped = all.map(mapContaToBank)
        if (!cancelled) setBanks(mapped)
  console.log(`/conta: carregadas ${all.length} contas em ${totalPages} páginas`)
      } catch (e) {
  console.error('Falha ao carregar /conta:', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const addEntity = (e: Omit<Entity, 'id'>) => {
    const newEntity = { id: uid('e'), ...e }
    setEntities(prev => [...prev, newEntity])
    return newEntity
  }

  const addBank = (b: Omit<Bank, 'id'>) => {
    const newBank = { id: uid('b'), ...b }
    setBanks(prev => [...prev, newBank])
    return newBank
  }

  const addEntry = (e: Omit<Entry, 'id' | 'date'>) => {
    const newEntry = { id: uid('ent'), date: new Date().toISOString(), ...e }
    setEntries(prev => [...prev, newEntry])
    return newEntry
  }

  const payEntry = (id: string, user: string, date?: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, paid: true, user, date: date ?? new Date().toISOString() } : e))
  }

  const value = useMemo(() => ({ 
    entities, 
    banks, 
    entries, 
    addEntity, 
    addBank, 
    addEntry, 
    payEntry 
  }), [entities, banks, entries])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}