import { createContext, useContext, type ReactNode } from 'react'
import { useCabinetAdminPanel } from '../hooks/useCabinetAdminPanel'

type Panel = ReturnType<typeof useCabinetAdminPanel>

const CabinetTableRowAdminContext = createContext<Panel | null>(null)

export function CabinetTableRowAdminProvider({ sellerId, children }: { sellerId: number; children: ReactNode }) {
  const panel = useCabinetAdminPanel(sellerId)
  return <CabinetTableRowAdminContext.Provider value={panel}>{children}</CabinetTableRowAdminContext.Provider>
}

export function useCabinetTableRowAdmin(): Panel {
  const v = useContext(CabinetTableRowAdminContext)
  if (!v) {
    throw new Error('useCabinetTableRowAdmin: нет провайдера (строка таблицы кабинетов)')
  }
  return v
}
