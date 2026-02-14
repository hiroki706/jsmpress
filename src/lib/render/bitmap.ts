export function drawBitmapToCanvas(
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = bitmap.width
  canvas.height = bitmap.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
}
