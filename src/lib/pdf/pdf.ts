import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getHalfSlice, type Half } from '../render/split'

GlobalWorkerOptions.workerSrc = workerSrc

export type PdfDocument = PDFDocumentProxy

export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function loadPdfDocument(file: File): Promise<PdfDocument> {
  const bytes = await readFileAsBytes(file)
  const task = getDocument({ data: bytes })
  return task.promise
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1
  return Math.min(Math.max(page, 1), totalPages)
}

export async function renderPageToCanvas(
  pdf: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 2,
): Promise<void> {
  const page = await pdf.getPage(pageNumber)
  await renderPdfPage(page, canvas, scale)
}

export async function renderPdfPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale = 2,
): Promise<void> {
  const viewport = page.getViewport({ scale })
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context is not available')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
}

export async function cropHalfToBitmap(
  sourceCanvas: HTMLCanvasElement,
  half: Half,
): Promise<ImageBitmap> {
  const { halfHeight, sourceY } = getHalfSlice(sourceCanvas.height, half)
  const targetCanvas = document.createElement('canvas')
  targetCanvas.width = sourceCanvas.width
  targetCanvas.height = halfHeight

  const ctx = targetCanvas.getContext('2d')
  if (!ctx) throw new Error('2D context is not available')

  ctx.drawImage(
    sourceCanvas,
    0,
    sourceY,
    sourceCanvas.width,
    halfHeight,
    0,
    0,
    targetCanvas.width,
    targetCanvas.height,
  )

  return createImageBitmap(targetCanvas)
}
