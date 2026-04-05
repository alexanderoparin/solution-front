/**
 * Файлы из буфера обмена при Ctrl+V (скриншот, копирование файла в проводнике и т.п.).
 */
export function getFilesFromClipboardData(data: DataTransfer | null): File[] {
  if (!data) return []
  const fromFiles = data.files ? Array.from(data.files) : []
  if (fromFiles.length > 0) return fromFiles

  const items = data.items
  if (!items?.length) return []
  const out: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const f = item.getAsFile()
      if (f) out.push(f)
    }
  }
  return out
}

/** Осмысленное имя для типичного скрина (image.png), чтобы не ломать список при нескольких вставках. */
export function renameGenericClipboardFile(file: File): File {
  const name = file.name?.trim()
  const generic =
    !name ||
    name === 'image.png' ||
    name === 'pasted-image.png' ||
    /^image\.(png|jpeg|jpg|webp)$/i.test(name)
  if (!generic) return file
  const type = file.type || 'image/png'
  const sub = type.includes('jpeg') || type.includes('jpg') ? 'jpg' : type.split('/')[1] || 'png'
  return new File([file], `скрин-${Date.now()}.${sub}`, { type })
}
