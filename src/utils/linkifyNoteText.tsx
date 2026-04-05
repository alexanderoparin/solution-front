import type { CSSProperties, ReactNode } from 'react'

/** http(s) и www.… без схемы */
const URL_PATTERN = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi

function trimTrailingPunct(url: string): string {
  let u = url
  while (u.length > 4 && '.,;:!?'.includes(u.slice(-1))) {
    u = u.slice(0, -1)
  }
  return u
}

function toHref(trimmed: string): string | null {
  const t = trimmed.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  if (/^www\./i.test(t)) return `https://${t}`
  return null
}

/**
 * Оборачивает URL в тексте заметки в безопасные внешние ссылки (без innerHTML).
 */
export function linkifyNoteText(text: string, linkStyle: CSSProperties = {}): ReactNode {
  if (!text) return null
  const out: ReactNode[] = []
  let last = 0
  const re = new RegExp(URL_PATTERN.source, 'gi')
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(text.slice(last, m.index))
    }
    const raw = m[0]
    const trimmed = trimTrailingPunct(raw)
    const href = toHref(trimmed)
    if (href == null) {
      out.push(raw)
      last = m.index + raw.length
      continue
    }
    out.push(
      <a
        key={`note-link-${k++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: 'underline',
          wordBreak: 'break-all',
          ...linkStyle,
        }}
      >
        {trimmed}
      </a>
    )
    if (raw.length > trimmed.length) {
      out.push(raw.slice(trimmed.length))
    }
    last = m.index + raw.length
  }
  if (last < text.length) {
    out.push(text.slice(last))
  }
  if (out.length === 0) {
    return text
  }
  if (out.length === 1 && typeof out[0] === 'string') {
    return out[0]
  }
  return out
}
