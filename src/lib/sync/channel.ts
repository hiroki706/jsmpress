export const CHANNEL_NAME = 'jsmpress-presentation'

export type FrameMessage = {
  type: 'FRAME'
  sessionId: string
  page: number
  totalPages: number
  bitmap: ImageBitmap
}

export type RequestSyncMessage = {
  type: 'REQUEST_SYNC'
  sessionId: string
}

export type PresentationMessage = FrameMessage | RequestSyncMessage

export function createPresentationChannel(): BroadcastChannel {
  return new BroadcastChannel(CHANNEL_NAME)
}

export function isRequestSyncMessage(
  message: PresentationMessage,
): message is RequestSyncMessage {
  return message.type === 'REQUEST_SYNC'
}

export function isFrameMessage(
  message: PresentationMessage,
): message is FrameMessage {
  return message.type === 'FRAME'
}

export function postFrameMessage(
  channel: BroadcastChannel,
  sessionId: string,
  page: number,
  totalPages: number,
  bitmap: ImageBitmap,
): void {
  const message: FrameMessage = {
    type: 'FRAME',
    sessionId,
    page,
    totalPages,
    bitmap,
  }
  channel.postMessage(message)
}

export function postRequestSync(
  channel: BroadcastChannel,
  sessionId: string,
): void {
  const message: RequestSyncMessage = { type: 'REQUEST_SYNC', sessionId }
  channel.postMessage(message)
}
