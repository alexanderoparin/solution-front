import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { CampaignScheduleSlot } from '../../types/analytics'
import {
  DAY_LABELS,
  SLOT_STEP_MINUTES,
  formatMinutesToTime,
  parseTimeToMinutes,
  snapMinutes,
} from '../../utils/campaignSlotTime'
import { colors, borderRadius, spacing } from '../../styles/analytics'

const HOUR_HEIGHT = 48
const HALF_HEIGHT = HOUR_HEIGHT / 2
const HOURS = 24
const GRID_HEIGHT = HOURS * HOUR_HEIGHT

export interface SlotCreateRange {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface CampaignWeekCalendarProps {
  slots: CampaignScheduleSlot[]
  disabled?: boolean
  onCreateRange: (range: SlotCreateRange) => void
  onUpdateSlot: (slotId: number, update: { startTime?: string; endTime?: string }) => void
  onEditSlot: (slot: CampaignScheduleSlot) => void
  onDeleteSlot: (slotId: number) => void
}

type DragMode = 'create' | 'resize-top' | 'resize-bottom'

interface DragState {
  mode: DragMode
  day: number
  slotId?: number
  startMinutes: number
  currentMinutes: number
}

function slotStyle(top: number, height: number): CSSProperties {
  return {
    position: 'absolute',
    left: 2,
    right: 2,
    top,
    height: Math.max(HALF_HEIGHT, height),
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.sm,
    fontSize: 10,
    padding: '2px 4px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxSizing: 'border-box',
    zIndex: 2,
    userSelect: 'none',
  }
}

function minutesToY(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT
}

function yToMinutes(y: number): number {
  return snapMinutes(Math.max(0, Math.min(24 * 60, (y / HOUR_HEIGHT) * 60)))
}

export default function CampaignWeekCalendar({
  slots,
  disabled,
  onCreateRange,
  onUpdateSlot,
  onEditSlot,
  onDeleteSlot,
}: CampaignWeekCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const finishDrag = useCallback(
    (state: DragState) => {
      const minStart = Math.min(state.startMinutes, state.currentMinutes)
      const minEnd = Math.max(state.startMinutes, state.currentMinutes) + SLOT_STEP_MINUTES
      if (state.mode === 'create') {
        if (minEnd - minStart >= SLOT_STEP_MINUTES) {
          onCreateRange({
            dayOfWeek: state.day,
            startTime: formatMinutesToTime(minStart),
            endTime: formatMinutesToTime(minEnd),
          })
        }
      } else if (state.slotId != null) {
        const slot = slots.find((s) => s.id === state.slotId)
        if (!slot) return
        const snapped = snapMinutes(state.currentMinutes)
        if (state.mode === 'resize-top') {
          const endMin = parseTimeToMinutes(slot.endTime)
          const newStart = Math.min(snapped, endMin - SLOT_STEP_MINUTES)
          onUpdateSlot(state.slotId, { startTime: formatMinutesToTime(newStart) })
        } else {
          const startMin = parseTimeToMinutes(slot.startTime)
          const newEnd = Math.max(snapped, startMin + SLOT_STEP_MINUTES)
          onUpdateSlot(state.slotId, { endTime: formatMinutesToTime(newEnd) })
        }
      }
    },
    [onCreateRange, onUpdateSlot, slots],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drag || !gridRef.current) return
      const rect = gridRef.current.getBoundingClientRect()
      const dayWidth = (rect.width - 48) / 7
      const dayIndex = Math.floor((e.clientX - rect.left - 48) / dayWidth)
      const day = Math.min(7, Math.max(1, dayIndex + 1))
      const y = e.clientY - rect.top
      const minutes = yToMinutes(y)
      setDrag((d) => (d ? { ...d, day: drag.mode === 'create' ? day : d.day, currentMinutes: minutes } : d))
    },
    [drag],
  )

  const handleMouseUp = useCallback(() => {
    if (drag) finishDrag(drag)
    setDrag(null)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [drag, finishDrag, handleMouseMove])

  const startDrag = (state: DragState) => {
    if (disabled) return
    setDrag(state)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const onDayMouseDown = (day: number, e: React.MouseEvent) => {
    if (disabled || (e.target as HTMLElement).closest('[data-slot]')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const minutes = yToMinutes(e.clientY - rect.top)
    startDrag({ mode: 'create', day, startMinutes: minutes, currentMinutes: minutes })
  }

  const previewForDay = (day: number) => {
    if (!drag || drag.day !== day) return null
    const a = Math.min(drag.startMinutes, drag.currentMinutes)
    const b = Math.max(drag.startMinutes, drag.currentMinutes) + SLOT_STEP_MINUTES
    return { top: minutesToY(a), height: minutesToY(b) - minutesToY(a) }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', minWidth: 720 }}>
        <div style={{ width: 48, flexShrink: 0, paddingTop: 28 }}>
          {Array.from({ length: HOURS }, (_, h) => (
            <div
              key={h}
              style={{
                height: HOUR_HEIGHT,
                fontSize: 10,
                color: colors.textSecondary,
                textAlign: 'right',
                paddingRight: 4,
                boxSizing: 'border-box',
              }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex' }} ref={gridRef}>
          {DAY_LABELS.map((label, idx) => {
            const day = idx + 1
            const daySlots = slots.filter((s) => s.dayOfWeek === day)
            const preview = previewForDay(day)
            return (
              <div key={day} style={{ flex: 1, minWidth: 80, borderLeft: `1px solid ${colors.borderLight}` }}>
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: spacing.xs,
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ position: 'relative', height: GRID_HEIGHT, backgroundColor: colors.bgGray }}
                  onMouseDown={(e) => onDayMouseDown(day, e)}
                >
                  {Array.from({ length: HOURS }, (_, h) => (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        top: h * HOUR_HEIGHT,
                        left: 0,
                        right: 0,
                        height: HOUR_HEIGHT,
                        borderTop: `1px solid ${colors.borderLight}`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                  {preview ? (
                    <div
                      style={{
                        ...slotStyle(preview.top, preview.height),
                        backgroundColor: 'rgba(124, 58, 237, 0.2)',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null}
                  {daySlots.map((slot) => {
                    const top = minutesToY(parseTimeToMinutes(slot.startTime))
                    const bottom = minutesToY(parseTimeToMinutes(slot.endTime))
                    const height = bottom - top
                    return (
                      <div
                        key={slot.id}
                        data-slot
                        style={slotStyle(top, height)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditSlot(slot)
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          if (window.confirm('Удалить слот?')) onDeleteSlot(slot.id)
                        }}
                      >
                        <div
                          style={{ height: 6, cursor: 'ns-resize', margin: '-2px -4px 0' }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            startDrag({
                              mode: 'resize-top',
                              day,
                              slotId: slot.id,
                              startMinutes: parseTimeToMinutes(slot.startTime),
                              currentMinutes: parseTimeToMinutes(slot.startTime),
                            })
                          }}
                        />
                        <div>
                          {slot.startTime}–{slot.endTime}
                          <br />
                          {slot.budgetRub} ₽
                        </div>
                        <div
                          style={{ height: 6, cursor: 'ns-resize', margin: '0 -4px -2px', position: 'absolute', bottom: 0, left: 0, right: 0 }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            startDrag({
                              mode: 'resize-bottom',
                              day,
                              slotId: slot.id,
                              startMinutes: parseTimeToMinutes(slot.endTime),
                              currentMinutes: parseTimeToMinutes(slot.endTime),
                            })
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm }}>
        Перетащите по пустой ячейке, чтобы создать слот (шаг 30 мин). Правый клик по слоту — удалить. Тяните верх/низ слота для изменения времени.
      </p>
    </div>
  )
}
