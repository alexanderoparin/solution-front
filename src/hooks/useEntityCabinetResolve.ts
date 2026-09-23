import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

/** Кабинет владельца сущности для автопереключения по прямой ссылке. */
export interface EntityCabinetResolve {
  cabinetId: number
  sellerId: number
  cabinetName?: string | null
}

type UseEntityCabinetResolveArgs = {
  /** Уникальный ключ сущности в React Query. */
  queryKey: readonly unknown[]
  /** Запрос resolve; не вызывается, если enabled=false. */
  resolveFn: () => Promise<EntityCabinetResolve>
  enabled: boolean
  isAdmin: boolean
  selectedCabinetId: number | null | undefined
  applyWorkContextCabinet: (cabinetId: number) => void
  setSellerCabinetId: (cabinetId: number | null) => void
}

/**
 * Резолвит кабинет сущности по id из URL, переключает контекст и даёт id для API-запросов.
 */
export function useEntityCabinetResolve({
  queryKey,
  resolveFn,
  enabled,
  isAdmin,
  selectedCabinetId,
  applyWorkContextCabinet,
  setSellerCabinetId,
}: UseEntityCabinetResolveArgs) {
  const {
    data: resolvedCabinet,
    isLoading: resolveLoading,
    isFetched: resolveFetched,
    isError: resolveError,
  } = useQuery({
    queryKey,
    queryFn: resolveFn,
    enabled,
    retry: false,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!resolvedCabinet) {
      return
    }
    if (isAdmin) {
      if (selectedCabinetId !== resolvedCabinet.cabinetId) {
        applyWorkContextCabinet(resolvedCabinet.cabinetId)
      }
      return
    }
    if (selectedCabinetId !== resolvedCabinet.cabinetId) {
      setSellerCabinetId(resolvedCabinet.cabinetId)
    }
  }, [
    resolvedCabinet,
    isAdmin,
    selectedCabinetId,
    applyWorkContextCabinet,
    setSellerCabinetId,
  ])

  const requestCabinetId = resolvedCabinet?.cabinetId ?? null
  const requestSellerId = isAdmin ? resolvedCabinet?.sellerId : undefined
  const cabinetReady = requestCabinetId != null
  const resolveFailed = enabled && resolveFetched && (resolveError || !resolvedCabinet)

  return {
    resolvedCabinet,
    requestCabinetId,
    requestSellerId,
    resolveLoading,
    resolveFetched,
    resolveFailed,
    cabinetReady,
  }
}
