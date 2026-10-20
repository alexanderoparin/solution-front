import TariffPurchaseModal from '../subscription/TariffPurchaseModal'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'

interface CampaignManagePlansModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Покупка «Управление РК» через общий мастер тарифов (multi-cabinet).
 */
export default function CampaignManagePlansModal({ open, onClose }: CampaignManagePlansModalProps) {
  const { cabinetId } = useCampaignManageAccess()

  if (!open) {
    return null
  }

  return (
    <TariffPurchaseModal
      open={open}
      kind="CAMPAIGN"
      preselectedCabinetIds={cabinetId != null ? [cabinetId] : undefined}
      onClose={onClose}
    />
  )
}
