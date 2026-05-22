import ExcelJS from 'exceljs'

export function getCellString(row: ExcelJS.Row, col: number): string {
  const cell = row.getCell(col)
  if (cell.value === null || cell.value === undefined) return ''
  if (cell.value instanceof Date) return cell.value.toISOString()
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return (cell.value as ExcelJS.CellRichTextValue).richText
      .map((r: ExcelJS.RichText) => r.text)
      .join('')
  }
  return String(cell.value).trim()
}

export function getCellDate(row: ExcelJS.Row, col: number): Date | null {
  const cell = row.getCell(col)
  if (cell.value instanceof Date) return cell.value
  if (typeof cell.value === 'number') {
    const epoch = new Date(1899, 11, 30)
    epoch.setDate(epoch.getDate() + cell.value)
    return epoch
  }
  return null
}

export function findHeaderRow(
  sheet: ExcelJS.Worksheet,
  markers: string[],
): { rowNumber: number; headers: Map<string, number> } | null {
  const upperMarkers = markers.map((m) => m.toUpperCase())

  for (let r = 1; r <= Math.min(sheet.rowCount, 30); r++) {
    const row = sheet.getRow(r)
    for (let c = 1; c <= row.cellCount; c++) {
      const val = getCellString(row, c).toUpperCase()
      if (upperMarkers.some((m) => val.includes(m))) {
        const headers = new Map<string, number>()
        for (let cc = 1; cc <= row.cellCount; cc++) {
          const h = getCellString(row, cc).toUpperCase().trim()
          if (h) headers.set(h, cc)
        }
        return { rowNumber: r, headers }
      }
    }
  }
  return null
}

export function findColumnByAnyName(headers: Map<string, number>, names: string[]): number | null {
  for (const name of names) {
    const upper = name.toUpperCase()
    for (const [key, col] of headers) {
      if (key.includes(upper)) return col
    }
  }
  return null
}
