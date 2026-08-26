import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
import { WORK_CONTEXT_CABINETS_QUERY_KEY } from './useWorkContextForAdmin'
import type { CabinetTokenType } from '../types/api'

function invalidateCabinetListCaches(queryClient: ReturnType<typeof useQueryClient>, sellerId: number) {
  void queryClient.invalidateQueries({ queryKey: ['sellerCabinets', sellerId] })
  void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
  void queryClient.invalidateQueries({ queryKey: WORK_CONTEXT_CABINETS_QUERY_KEY })
}

/**
 * Состояние и мутации для админ-панели кабинета (карточка в профиле селлера или строка таблицы).
 */
export function useCabinetAdminPanel(sellerId: number) {
  const queryClient = useQueryClient()
  const [validateCooldown, setValidateCooldown] = useState(0)
  const [validatePerformanceCooldown, setValidatePerformanceCooldown] = useState(0)
  const [editingKey, setEditingKey] = useState(false)
  const [editKeyValue, setEditKeyValue] = useState('')
  const [editTokenType, setEditTokenType] = useState<CabinetTokenType>('BASIC')
  const [editingPerformance, setEditingPerformance] = useState(false)
  const [editPerformanceClientId, setEditPerformanceClientId] = useState('')
  const [editPerformanceClientSecret, setEditPerformanceClientSecret] = useState('')

  useEffect(() => {
    if (validateCooldown <= 0) return
    const t = setInterval(() => setValidateCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [validateCooldown])

  useEffect(() => {
    if (validatePerformanceCooldown <= 0) return
    const t = setInterval(() => setValidatePerformanceCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [validatePerformanceCooldown])

  const validateKeyMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.validateSellerCabinetKey(cabinetId),
    onMutate: () => setValidateCooldown(30),
    onSuccess: (data) => {
      message.success(data.message || 'Проверка ключа выполнена')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проверки ключа')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
  })

  const validatePerformanceMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.validateOzonPerformance(cabinetId),
    onMutate: () => setValidatePerformanceCooldown(30),
    onSuccess: (data) => {
      message.success(data.message || 'Performance credentials проверены')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проверки Performance credentials')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
  })

  const updateKeyMutation = useMutation({
    mutationFn: ({ cabinetId, apiKey, tokenType }: { cabinetId: number; apiKey?: string; tokenType?: CabinetTokenType }) =>
      userApi.updateSellerCabinetKey(cabinetId, apiKey, tokenType),
    onSuccess: () => {
      message.success('Кабинет обновлён')
      invalidateCabinetListCaches(queryClient, sellerId)
      setEditingKey(false)
      setEditKeyValue('')
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      const d = ax.response?.data
      message.error(d?.error ?? d?.message ?? 'Ошибка обновления ключа')
    },
  })

  const updatePerformanceMutation = useMutation({
    mutationFn: ({
      cabinetId,
      ozonPerformanceClientId,
      ozonPerformanceClientSecret,
    }: {
      cabinetId: number
      ozonPerformanceClientId?: string
      ozonPerformanceClientSecret?: string
    }) =>
      userApi.updateSellerCabinetPerformance(cabinetId, {
        ozonPerformanceClientId,
        ozonPerformanceClientSecret,
      }),
    onSuccess: () => {
      message.success('Performance credentials обновлены')
      invalidateCabinetListCaches(queryClient, sellerId)
      setEditingPerformance(false)
      setEditPerformanceClientId('')
      setEditPerformanceClientSecret('')
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      const d = ax.response?.data
      message.error(d?.error ?? d?.message ?? 'Ошибка обновления Performance credentials')
    },
  })

  const triggerCabinetUpdateMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.triggerCabinetDataUpdate(cabinetId),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление запущено')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка запуска обновления')
    },
  })

  const triggerCabinetStocksUpdateMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.triggerCabinetStocksUpdate(cabinetId),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление остатков запущено')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка запуска обновления остатков')
    },
  })

  return {
    validateCooldown,
    validatePerformanceCooldown,
    editingKey,
    setEditingKey,
    editKeyValue,
    setEditKeyValue,
    editTokenType,
    setEditTokenType,
    editingPerformance,
    setEditingPerformance,
    editPerformanceClientId,
    setEditPerformanceClientId,
    editPerformanceClientSecret,
    setEditPerformanceClientSecret,
    validateKeyMutation,
    validatePerformanceMutation,
    updateKeyMutation,
    updatePerformanceMutation,
    triggerCabinetUpdateMutation,
    triggerCabinetStocksUpdateMutation,
  }
}
