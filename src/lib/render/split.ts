export type Half = 'top' | 'bottom'

export function getHalfSlice(height: number, half: Half): {
  sourceY: number
  halfHeight: number
} {
  const halfHeight = Math.floor(height / 2)
  const sourceY = half === 'top' ? 0 : height - halfHeight
  return { sourceY, halfHeight }
}
