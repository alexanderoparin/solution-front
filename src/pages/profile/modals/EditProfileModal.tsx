import { useEffect } from 'react'
import { Modal, Form, Input, Select, Button } from 'antd'
import type { AccountType, UpdateProfileRequest, UserProfileResponse } from '../../../types/api'
import { ACCOUNT_TYPE_LABELS } from '../../../constants/accountTypeLabels'

const accent = '#7C3AED'

const ACCOUNT_TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((value) => ({
  value,
  label: ACCOUNT_TYPE_LABELS[value],
}))

interface EditProfileModalProps {
  open: boolean
  profile: UserProfileResponse
  loading: boolean
  onCancel: () => void
  onSubmit: (values: UpdateProfileRequest) => void
}

export default function EditProfileModal({
  open,
  profile,
  loading,
  onCancel,
  onSubmit,
}: EditProfileModalProps) {
  const [form] = Form.useForm<UpdateProfileRequest>()

  const isAdmin = profile.role === 'ADMIN'

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: profile.name ?? '',
        accountTypes: profile.accountTypes ?? [],
      })
    }
  }, [open, profile, form])

  return (
    <Modal
      title={isAdmin ? 'Изменить имя' : 'Редактирование профиля'}
      open={open}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          style={{ backgroundColor: accent, borderColor: accent }}
          onClick={() => form.submit()}
        >
          Сохранить
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        onFinish={(values) => {
          if (isAdmin) {
            onSubmit({
              name: values.name?.trim() || undefined,
            })
            return
          }
          onSubmit({
            name: values.name?.trim() || undefined,
            accountTypes: values.accountTypes,
          })
        }}
      >
        <Form.Item
          name="name"
          label="Имя"
          rules={[{ max: 120, message: 'Не более 120 символов' }]}
        >
          <Input placeholder="Как к вам обращаться" autoComplete="off" />
        </Form.Item>

        {!isAdmin && (
          <Form.Item
            name="accountTypes"
            label="Тип аккаунта"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: 'Выберите хотя бы один тип аккаунта',
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Выберите типы аккаунта"
              options={ACCOUNT_TYPE_OPTIONS}
              optionFilterProp="label"
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
