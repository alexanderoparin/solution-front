import { Modal, Button } from 'antd'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'

const accent = '#7C3AED'

interface CampaignManagePaywallModalProps {
  open: boolean
  onClose: () => void
}

export default function CampaignManagePaywallModal({ open, onClose }: CampaignManagePaywallModalProps) {
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
      title="Подписка"
    >
      <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
        Для использования данного функционала необходимо оплатить Подписку
      </p>
      <Button
        type="primary"
        block
        size="large"
        style={{ backgroundColor: accent, borderColor: accent }}
        onClick={() => {
          onClose()
          openPlans()
        }}
      >
        Перейти в раздел «Подписка»
      </Button>
    </Modal>
  )
}
