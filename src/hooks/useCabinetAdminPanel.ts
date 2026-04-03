import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
function invalidateCabinetListCaches(queryClient: ReturnType<typeof useQueryClient>, sellerId: number) {
  void queryClient.invalidateQueries({ queryKey: ['sellerCabinets', sellerId] })
  void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
}

/**
 * Состояние и мутации для админ-панели кабинета (карточка в профиле селлера или строка таблицы).
 */
export function useCabinetAdminPanel(sellerId: number) {
  const queryClient = useQueryClient()
  const [validateCooldown, setValidateCooldown] = useState(0)
  const [editingKey, setEditingKey] = useState(false)
  const [editKeyValue, setEditKeyValue] = useState('')

  useEffect(() => {
    if (validateCooldown <= 0) return
    const t = setInterval(() => setValidateCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [validateCooldown])

  const validateKeyMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.validateSellerCabinetKey(cabinetId),
    onMutate: () => setValidateCooldown(30),
    onSuccess: (data) => {
      message.success(data.message || 'Проверка ключа выполнена')
      invalidateCabinetListCaches(queryClient, sellerId)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проверки ключа')
    },
  })

  const updateKeyMutation = useMutation({
    mutationFn: ({ cabinetId, apiKey }: { cabinetId: number; apiKey: string }) =>
      userApi.updateSellerCabinetKey(cabinetId, apiKey),
    onSuccess: () => {
      message.success('Ключ обновлён')
      invalidateCabinetListCaches(queryClient, sellerId)
      setEditingKey(false)
      setEditKeyValue('')
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка обновления ключа')
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
    editingKey,
    setEditingKey,
    editKeyValue,
    setEditKeyValue,
    validateKeyMutation,
    updateKeyMutation,
    triggerCabinetUpdateMutation,
    triggerCabinetStocksUpdateMutation,
  }
}
