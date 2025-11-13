import { createContext, useContext, useMemo, useState, useEffect } from 'react'
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

function uid(prefix = '') { return prefix + Math.random().toString(36).slice(2,9) }

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

export const FinanceProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [entities, setEntities] = useState<Entity[]>(() => [
    { id: 'e1', name: 'Cliente A', isClient: true },
    { id: 'e2', name: 'Fornecedor X', isClient: false },
  ])
  const [banks, setBanks] = useState<Bank[]>(() => [])
  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: 'ent1', date: new Date().toISOString(), user: 'system', entityId: 'e1', bankId: 'b1', type: 'receivable', description: 'Duplicata venda', amount: 1200, paid: false },
  ])

  const mapContaToBank = (c: ContaApi): Bank => ({
    id: String(c.idConta),
    name: `${c.fkBanco?.nomeBanco ?? 'Banco'} • Ag ${c.agencia} Cc ${c.conta}-${c.dvConta}`,
    balance: Number(c.saldo ?? 0),
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
  const first = await api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: 0 } })
        let all: ContaApi[] = first.data.content ?? []
        const totalPages = Number(first.data.totalPages ?? 1)

        for (let p = 1; p < totalPages; p++) {
          const res = await api.get<PaginatedResponse<ContaApi>>('/conta', { params: { page: p } })
          all = all.concat(res.data.content ?? [])
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
    const ne = { ...e, id: uid('e') }
    setEntities(v => [...v, ne])
    return ne
  }
  const addBank = (b: Omit<Bank, 'id'>) => {
    const nb = { ...b, id: uid('b') }
    setBanks(v => [...v, nb])
    return nb
  }

  const addEntry = (e: Omit<Entry, 'id' | 'date'>) => {
    const ne: Entry = { ...e, id: uid('ent'), date: new Date().toISOString() }
    setEntries(v => [ne, ...v])
    if (ne.paid && ne.bankId) {
      setBanks(bs => bs.map(b => b.id === ne.bankId ? { ...b, balance: Math.round((b.balance + (ne.type === 'receivable' ? ne.amount : -ne.amount)) * 100) / 100 } : b))
      const bankMove: Entry = { id: uid('ent'), date: new Date().toISOString(), user: ne.user, bankId: ne.bankId, type: 'bank', description: `Movimento automático: ${ne.description ?? ''}`, amount: ne.type === 'receivable' ? ne.amount : -ne.amount }
      setEntries(v => [bankMove, ...v])
    }
    return ne
  }

  const payEntry = (id: string, user: string, date = new Date().toISOString()) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    if (entry.paid) return
    setEntries(v => v.map(e => e.id === id ? { ...e, paid: true, user, date } : e))
    if (entry.bankId) {
      setBanks(bs => bs.map(b => b.id === entry.bankId ? { ...b, balance: Math.round((b.balance + (entry.type === 'receivable' ? entry.amount : -entry.amount)) * 100) / 100 } : b))
      const bankMove: Entry = { id: uid('ent'), date, user, bankId: entry.bankId, type: 'bank', description: `Movimento automático: ${entry.description ?? ''}`, amount: entry.type === 'receivable' ? entry.amount : -entry.amount }
      setEntries(v => [bankMove, ...v])
    }
  }

  const value = useMemo(() => ({ entities, banks, entries, addEntity, addBank, addEntry, payEntry }), [entities, banks, entries])
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const c = useContext(FinanceContext)
  if (!c) throw new Error('useFinance must be used inside FinanceProvider')
  return c
}
