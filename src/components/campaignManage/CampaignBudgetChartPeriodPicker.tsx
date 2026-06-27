import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker, message } from 'antd'
import locale from 'antd/locale/ru_RU'
import { borderRadius } from '../../styles/analytics'
import { BUDGET_CHART_MAX_DAYS, isBudgetChartPeriodValid } from '../../utils/budgetChartPeriod'

interface CampaignBudgetChartPeriodPickerProps {
  value: [Dayjs, Dayjs]
  onChange: (range: [Dayjs, Dayjs]) => void
  disabled?: boolean
}

export default function CampaignBudgetChartPeriodPicker({
  value,
  onChange,
  disabled,
}: CampaignBudgetChartPeriodPickerProps) {
  const pickerValue: [Dayjs, Dayjs] = [value[0].startOf('day'), value[1].startOf('day')]

  return (
    <DatePicker.RangePicker
      locale={locale.DatePicker}
      value={pickerValue}
      disabled={disabled}
      allowClear={false}
      format="DD.MM.YYYY"
      placeholder={['Начало', 'Конец']}
      style={{ width: 220, borderRadius: borderRadius.sm }}
      onChange={(dates) => {
        if (dates == null || dates[0] == null || dates[1] == null) {
          return
        }
        const from = dates[0].startOf('day')
        let to = dates[1].endOf('day')
        const now = dayjs()
        if (to.isAfter(now)) {
          to = now
        }
        if (!isBudgetChartPeriodValid(from, to)) {
          message.warning(`Период не может превышать ${BUDGET_CHART_MAX_DAYS} дней`)
          return
        }
        onChange([from, to])
      }}
      disabledDate={(current, { from }) => {
        if (current == null) {
          return false
        }
        if (current.isAfter(dayjs(), 'day')) {
          return true
        }
        if (from != null) {
          const tooLate = from.add(BUDGET_CHART_MAX_DAYS, 'day')
          const tooEarly = from.subtract(BUDGET_CHART_MAX_DAYS, 'day')
          return current.isAfter(tooLate, 'day') || current.isBefore(tooEarly, 'day')
        }
        return false
      }}
    />
  )
}
