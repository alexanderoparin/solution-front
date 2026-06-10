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

const HOUR_HEIGHT = 48
const HALF_HEIGHT = HOUR_HEIGHT / 2
const HOURS = 24
const GRID_HEIGHT = HOURS * HOUR_HEIGHT
/** Видимая высота календаря (~8 ч); полные сутки прокручиваются внутри. */
const CALENDAR_VIEWPORT_HEIGHT = 400
const TIME_COLUMN_WIDTH = 36
const DAY_MIN_WIDTH = 56
const CALENDAR_MIN_WIDTH = TIME_COLUMN_WIDTH + DAY_MIN_WIDTH * 7
const DAY_HEADER_HEIGHT = 26
/** При открытии — прокрутка к 08:00. */
const INITIAL_SCROLL_TOP = 8 * HOUR_HEIGHT

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
    left: 1,
    right: 1,
    top,
    height: Math.max(HALF_HEIGHT, height),
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.sm,
    fontSize: 9,
    padding: '1px 2px',
    lineHeight: 1.2,
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  /** Актуальное состояние drag для window-слушателей (без stale closure). */
  const dragRef = useRef<DragState | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = INITIAL_SCROLL_TOP
  }, [])

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
    const minutes = yToMinutes(y)
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
    <div>
      <div
        style={{
          display: 'flex',
          minWidth: CALENDAR_MIN_WIDTH,
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.bgWhite,
        }}
      >
        <div style={{ width: TIME_COLUMN_WIDTH, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: DAY_MIN_WIDTH,
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 11,
                height: DAY_HEADER_HEIGHT,
                lineHeight: `${DAY_HEADER_HEIGHT}px`,
                borderLeft: `1px solid ${colors.borderLight}`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        style={{
          maxHeight: CALENDAR_VIEWPORT_HEIGHT,
          overflowY: 'auto',
          overflowX: 'auto',
          border: `1px solid ${colors.borderLight}`,
          borderTop: 'none',
          borderRadius: `0 0 ${borderRadius.sm} ${borderRadius.sm}`,
        }}
      >
        <div style={{ display: 'flex', minWidth: CALENDAR_MIN_WIDTH }}>
          <div style={{ width: TIME_COLUMN_WIDTH, flexShrink: 0 }}>
            {Array.from({ length: HOURS }, (_, h) => (
              <div
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  fontSize: 9,
                  color: colors.textSecondary,
                  textAlign: 'right',
                  paddingRight: 2,
                  boxSizing: 'border-box',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }} ref={gridRef}>
            {DAY_LABELS.map((_, idx) => {
              const day = idx + 1
              const daySlots = slots.filter((s) => s.dayOfWeek === day)
              const preview = previewForDay(day)
              return (
                <div key={day} style={{ flex: 1, minWidth: DAY_MIN_WIDTH, borderLeft: `1px solid ${colors.borderLight}` }}>
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
                                width: 18,
                                height: 18,
                                padding: 0,
                                border: 'none',
                                borderRadius: '0 3px 0 3px',
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
                              <CloseOutlined style={{ fontSize: 10 }} />
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
      </div>
      <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm }}>
        {disabled
          ? 'Управление расписанием недоступно (ограничение API WB).'
          : 'Кликните или перетащите по пустой ячейке, чтобы создать слот (шаг 30 мин). Слоты в один день не должны пересекаться. Клик по слоту — редактирование. Крестик или правый клик — удалить.'}
      </p>
    </div>
  )
}
