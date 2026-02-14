<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { drawBitmapToCanvas } from '../lib/render/bitmap'
  import {
    createPresentationChannel,
    isFrameMessage,
    postRequestSync,
    type PresentationMessage,
  } from '../lib/sync/channel'

  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('sid') ?? ''

  let slideCanvas: HTMLCanvasElement | null = null
  let currentPage = 0
  let totalPages = 0
  let channel: BroadcastChannel | null = null

  function requestSync(): void {
    if (!channel || !sessionId) return
    postRequestSync(channel, sessionId)
  }

  onMount(() => {
    channel = createPresentationChannel()
    channel.onmessage = (event: MessageEvent<PresentationMessage>) => {
      const message = event.data
      if (!isFrameMessage(message)) return
      if (message.sessionId !== sessionId) {
        message.bitmap.close()
        return
      }

      if (slideCanvas) {
        drawBitmapToCanvas(slideCanvas, message.bitmap)
      }
      currentPage = message.page
      totalPages = message.totalPages
      message.bitmap.close()
    }

    requestSync()
  })

  onDestroy(() => {
    channel?.close()
  })
</script>

<div class="audience-screen">
  {#if sessionId}
    <canvas class="audience-canvas" bind:this={slideCanvas}></canvas>
    <div class="audience-page">{currentPage} / {totalPages}</div>
  {:else}
    <p class="audience-error">共有セッションIDがありません</p>
  {/if}
</div>
