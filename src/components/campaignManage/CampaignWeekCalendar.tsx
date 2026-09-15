import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { CampaignScheduleSlot } from '../../types/analytics'
import {
  DAY_LABELS,
  SLOT_STEP_MINUTES,
  formatMinutesToTime,
  parseTimeToMinutes,
  snapMinutes,
} from '../../utils/campaignSlotTime'
import { findOverlappingSlot } from '../../utils/campaignSlotOverlap'
import { colors, borderRadius, spacing } from '../../styles/analytics'

const HOURS = 24

function useIsNarrow(maxWidthPx = 900): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches : false,
  )
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const onChange = () => setNarrow(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [maxWidthPx])
  return narrow
}

function minutesToY(minutes: number, hourHeight: number): number {
  return (minutes / 60) * hourHeight
}

function yToMinutes(y: number, hourHeight: number): number {
  return snapMinutes(Math.max(0, Math.min(24 * 60, (y / hourHeight) * 60)))
}

function slotStyle(top: number, height: number, hourHeight: number, compact: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: compact ? 0 : 1,
    right: compact ? 0 : 1,
    top,
    height: Math.max(hourHeight / 2, height),
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    border: `1px solid ${colors.primary}`,
    borderRadius: compact ? 3 : borderRadius.sm,
    fontSize: compact ? 9 : 11,
    padding: compact ? '1px 1px' : '2px 3px',
    lineHeight: 1.15,
    overflow: 'hidden',
    cursor: 'pointer',
    boxSizing: 'border-box',
    zIndex: 2,
    userSelect: 'none',
  }
}

export interface SlotCreateRange {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface CampaignWeekCalendarProps {
  slots: CampaignScheduleSlot[]
  disabled?: boolean
  /** data-tour-id для обучалки (сетка создания слотов) */
  tourTargetId?: string
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

export default function CampaignWeekCalendar({
  slots,
  disabled,
  tourTargetId,
  onCreateRange,
  onUpdateSlot,
  onEditSlot,
  onDeleteSlot,
}: CampaignWeekCalendarProps) {
  const compact = useIsNarrow(900)
  const hourHeight = compact ? 16 : 24
  const timeColumnWidth = compact ? 26 : 36
  const dayMinWidth = compact ? 40 : 56
  const calendarMinWidth = timeColumnWidth + dayMinWidth * 7
  const dayHeaderHeight = compact ? 22 : 26
  const gridHeight = HOURS * hourHeight
  const hourHeightRef = useRef(hourHeight)
  hourHeightRef.current = hourHeight

  const gridRef = useRef<HTMLDivElement>(null)
  /** Актуальное состояние drag для window-слушателей (без stale closure). */
  const dragRef = useRef<DragState | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const finishDrag = useCallback(
    (state: DragState) => {
      const minStart = Math.min(state.startMinutes, state.currentMinutes)
      const minEnd = Math.max(state.startMinutes, state.currentMinutes) + SLOT_STEP_MINUTES
      if (state.mode === 'create') {
        if (minEnd - minStart >= SLOT_STEP_MINUTES) {
          const startTime = formatMinutesToTime(minStart)
          const endTime = formatMinutesToTime(minEnd)
          const conflict = findOverlappingSlot(slots, state.day, startTime, endTime)
          if (conflict) {
            const dayLabel = DAY_LABELS[state.day - 1] ?? String(state.day)
            message.warning(
              `Слот пересекается с другим (${conflict.startTime}–${conflict.endTime}, ${dayLabel})`,
            )
            return
          }
          onCreateRange({ dayOfWeek: state.day, startTime, endTime })
        }
      } else if (state.slotId != null) {
        const slot = slots.find((s) => s.id === state.slotId)
        if (!slot) return
        const snapped = snapMinutes(state.currentMinutes)
        let startTime = slot.startTime
        let endTime = slot.endTime
        if (state.mode === 'resize-top') {
          const endMin = parseTimeToMinutes(slot.endTime)
          const newStart = Math.min(snapped, endMin - SLOT_STEP_MINUTES)
          startTime = formatMinutesToTime(newStart)
        } else {
          const startMin = parseTimeToMinutes(slot.startTime)
          const newEnd = Math.max(snapped, startMin + SLOT_STEP_MINUTES)
          endTime = formatMinutesToTime(newEnd)
        }
        const conflict = findOverlappingSlot(slots, slot.dayOfWeek, startTime, endTime, slot.id)
        if (conflict) {
          const dayLabel = DAY_LABELS[slot.dayOfWeek - 1] ?? String(slot.dayOfWeek)
          message.warning(
            `Слот пересекается с другим (${conflict.startTime}–${conflict.endTime}, ${dayLabel})`,
          )
          return
        }
        if (state.mode === 'resize-top') {
          onUpdateSlot(state.slotId, { startTime })
        } else {
          onUpdateSlot(state.slotId, { endTime })
        }
      }
    },
    [onCreateRange, onUpdateSlot, slots],
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const current = dragRef.current
    if (!current || !gridRef.current) return
    const gridRect = gridRef.current.getBoundingClientRect()
    const dayWidth = gridRect.width / 7
    const dayIndex = Math.floor((e.clientX - gridRect.left) / dayWidth)
    const day = Math.min(7, Math.max(1, dayIndex + 1))
    const y = e.clientY - gridRect.top
    const minutes = yToMinutes(y, hourHeightRef.current)
    const next: DragState = {
      ...current,
      day: current.mode === 'create' ? day : current.day,
      currentMinutes: minutes,
    }
    dragRef.current = next
    setDrag(next)
  }, [])

  const handleMouseUp = useCallback(() => {
    const current = dragRef.current
    if (current) finishDrag(current)
    dragRef.current = null
    setDrag(null)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [finishDrag, handleMouseMove])

  const startDrag = (state: DragState) => {
    if (disabled) return
    dragRef.current = state
    setDrag(state)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const onDayMouseDown = (day: number, e: React.MouseEvent) => {
    if (disabled || (e.target as HTMLElement).closest('[data-slot]')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const minutes = yToMinutes(e.clientY - rect.top, hourHeight)
    startDrag({ mode: 'create', day, startMinutes: minutes, currentMinutes: minutes })
  }

  const previewForDay = (day: number) => {
    if (!drag || drag.day !== day) return null
    const a = Math.min(drag.startMinutes, drag.currentMinutes)
    const b = Math.max(drag.startMinutes, drag.currentMinutes) + SLOT_STEP_MINUTES
    return { top: minutesToY(a, hourHeight), height: minutesToY(b, hourHeight) - minutesToY(a, hourHeight) }
  }

  return (
    <div style={{ overflowX: compact ? 'visible' : 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div
        style={{
          display: 'flex',
          minWidth: compact ? 0 : calendarMinWidth,
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.bgWhite,
        }}
      >
        <div style={{ width: timeColumnWidth, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: compact ? 0 : dayMinWidth,
                textAlign: 'center',
                fontWeight: 600,
                fontSize: compact ? 10 : 11,
                height: dayHeaderHeight,
                lineHeight: `${dayHeaderHeight}px`,
                borderLeft: `1px solid ${colors.borderLight}`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div
        data-tour-id={tourTargetId}
        style={{
          height: gridHeight,
          overflow: 'hidden',
          border: `1px solid ${colors.borderLight}`,
          borderTop: 'none',
          borderRadius: `0 0 ${borderRadius.sm} ${borderRadius.sm}`,
        }}
      >
        <div style={{ display: 'flex', minWidth: compact ? 0 : calendarMinWidth }}>
          <div style={{ width: timeColumnWidth, flexShrink: 0 }}>
            {Array.from({ length: HOURS }, (_, h) => (
              <div
                key={h}
                style={{
                  height: hourHeight,
                  fontSize: compact ? 8 : 9,
                  color: colors.textSecondary,
                  textAlign: 'right',
                  paddingRight: 2,
                  boxSizing: 'border-box',
                  lineHeight: `${hourHeight}px`,
                }}
              >
                {compact ? String(h).padStart(2, '0') : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }} ref={gridRef}>
            {DAY_LABELS.map((_, idx) => {
              const day = idx + 1
              const daySlots = slots.filter((s) => s.dayOfWeek === day)
              const preview = previewForDay(day)
              return (
                <div key={day} style={{ flex: 1, minWidth: compact ? 0 : dayMinWidth, borderLeft: `1px solid ${colors.borderLight}` }}>
                  <div
                    style={{ position: 'relative', height: gridHeight, backgroundColor: colors.bgGray }}
                    onMouseDown={(e) => onDayMouseDown(day, e)}
                  >
                    {Array.from({ length: HOURS }, (_, h) => (
                      <div
                        key={h}
                        style={{
                          position: 'absolute',
                          top: h * hourHeight,
                          left: 0,
                          right: 0,
                          height: hourHeight,
                          borderTop: `1px solid ${colors.borderLight}`,
                          pointerEvents: 'none',
                        }}
                      />
                    ))}
                    {preview ? (
                      <div
                        style={{
                          ...slotStyle(preview.top, preview.height, hourHeight, compact),
                          backgroundColor: 'rgba(124, 58, 237, 0.2)',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null}
                    {daySlots.map((slot) => {
                      const top = minutesToY(parseTimeToMinutes(slot.startTime), hourHeight)
                      const bottom = minutesToY(parseTimeToMinutes(slot.endTime), hourHeight)
                      const height = bottom - top
                      return (
                        <div
                          key={slot.id}
                          data-slot
                          style={slotStyle(top, height, hourHeight, compact)}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditSlot(slot)
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            onDeleteSlot(slot.id)
                          }}
                        >
                          {!disabled && (
                            <button
                              type="button"
                              aria-label="Удалить слот"
                              title="Удалить слот"
                              style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 14,
                                height: 14,
                                padding: 0,
                                border: 'none',
                                borderRadius: '0 2px 0 2px',
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: colors.textSecondary,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 4,
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteSlot(slot.id)
                              }}
                            >
                              <CloseOutlined style={{ fontSize: 8 }} />
                            </button>
                          )}
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
                            {compact
                              ? `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`
                              : `${slot.startTime}–${slot.endTime}`}
                            <br />
                            {compact ? slot.budgetRub : `${slot.budgetRub} ₽`}
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
      </div>
      <p style={{ fontSize: compact ? 10 : 11, color: colors.textSecondary, marginTop: compact ? 8 : spacing.sm }}>
        {disabled
          ? 'Управление расписанием недоступно (ограничение API WB).'
          : compact
            ? 'Нажмите пустую ячейку — слот. Клик по слоту — правка, крестик — удалить.'
            : 'Кликните или перетащите по пустой ячейке, чтобы создать слот (шаг 30 мин). Слоты в один день не должны пересекаться. Клик по слоту — редактирование. Крестик или правый клик — удалить.'}
      </p>
    </div>
  )
}
