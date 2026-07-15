import { useState } from 'react'
import { Button, Typography, message } from 'antd'
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cabinetsApi } from '../api/cabinets'
import type { CreateCabinetRequest } from '../types/api'
import { getRequestFailureDescription } from '../utils/requestError'
import AddCabinetModal from '../pages/profile/modals/AddCabinetModal'

const { Text, Title } = Typography

interface NoCabinetsPlaceholderProps {
  onCreated?: () => void
  /** empty — полный блок; button — только кнопка; modal-only — только модалка. */
  variant?: 'empty' | 'button' | 'modal-only'
  /** false — не рендерить модалку (используйте отдельный modal-only). По умолчанию true. */
  withModal?: boolean
  addModalOpen?: boolean
  onAddModalOpenChange?: (open: boolean) => void
}

export default function NoCabinetsPlaceholder({
  onCreated,
  variant = 'empty',
  withModal = true,
  addModalOpen,
  onAddModalOpenChange,
}: NoCabinetsPlaceholderProps) {
  const queryClient = useQueryClient()
  const [internalModalOpen, setInternalModalOpen] = useState(false)

  const modalOpen = addModalOpen ?? internalModalOpen

  const setModalOpen = (open: boolean) => {
    if (onAddModalOpenChange) {
      onAddModalOpenChange(open)
    } else {
      setInternalModalOpen(open)
    }
  }

  const createMutation = useMutation({
    mutationFn: cabinetsApi.create,
    onSuccess: () => {
      message.success('Кабинет создан')
      setModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
      void queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      onCreated?.()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  return (
    <>
      {variant === 'empty' ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '1px dashed #E2E8F0',
            borderRadius: 12,
            background: '#FAFAFA',
          }}
        >
          <AppstoreOutlined style={{ fontSize: 48, color: '#CBD5E1', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>
            Нет кабинетов
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
            Добавьте первый кабинет Wildberries, чтобы начать работу с аналитикой и рекламой.
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
          >
            Добавить кабинет
          </Button>
        </div>
      ) : variant === 'button' ? (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          Добавить кабинет
        </Button>
      ) : null}

      {(withModal || variant === 'modal-only') && (
        <AddCabinetModal
          open={modalOpen}
          loading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
          onSubmit={(values: CreateCabinetRequest) => createMutation.mutate(values)}
        />
      )}
    </>
  )
}
