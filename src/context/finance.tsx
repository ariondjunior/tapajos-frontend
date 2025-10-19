import { createContext, useContext, useMemo, useState } from 'react'

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
  date: string // ISO
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

export const FinanceProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [entities, setEntities] = useState<Entity[]>(() => [
    { id: 'e1', name: 'Cliente A', isClient: true },
    { id: 'e2', name: 'Fornecedor X', isClient: false },
  ])
  const [banks, setBanks] = useState<Bank[]>(() => [
    { id: 'b1', name: 'Banco do Brasil', balance: 10000 },
    { id: 'b2', name: 'Caixa', balance: 5000 },
  ])
  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: 'ent1', date: new Date().toISOString(), user: 'system', entityId: 'e1', bankId: 'b1', type: 'receivable', description: 'Duplicata venda', amount: 1200, paid: false },
  ])

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
    // if it's already paid and linked to bank, create bank movement
    if (ne.paid && ne.bankId) {
      setBanks(bs => bs.map(b => b.id === ne.bankId ? { ...b, balance: Math.round((b.balance + (ne.type === 'receivable' ? ne.amount : -ne.amount)) * 100) / 100 } : b))
      // add bank entry record
      const bankMove: Entry = { id: uid('ent'), date: new Date().toISOString(), user: ne.user, bankId: ne.bankId, type: 'bank', description: `Movimento automático: ${ne.description ?? ''}`, amount: ne.type === 'receivable' ? ne.amount : -ne.amount }
      setEntries(v => [bankMove, ...v])
    }
    return ne
  }

  const payEntry = (id: string, user: string, date = new Date().toISOString()) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    if (entry.paid) return
    // mark as paid
    setEntries(v => v.map(e => e.id === id ? { ...e, paid: true, user, date } : e))
    // create bank movement and update balance
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
