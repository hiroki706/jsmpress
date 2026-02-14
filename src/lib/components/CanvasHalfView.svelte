<script lang="ts">
  import { getHalfSlice, type Half } from '../render/split'

  export let sourceCanvas: HTMLCanvasElement | null = null
  export let half: Half = 'top'
  export let revision = 0

  let viewCanvas: HTMLCanvasElement | null = null

  function redrawHalf(): void {
    if (!sourceCanvas || !viewCanvas) return

    const ctx = viewCanvas.getContext('2d')
    if (!ctx) return

    const { halfHeight, sourceY } = getHalfSlice(sourceCanvas.height, half)
    viewCanvas.width = sourceCanvas.width
    viewCanvas.height = halfHeight
    ctx.clearRect(0, 0, viewCanvas.width, viewCanvas.height)
    ctx.drawImage(
      sourceCanvas,
      0,
      sourceY,
      sourceCanvas.width,
      halfHeight,
      0,
      0,
      sourceCanvas.width,
      halfHeight,
    )
  }

  $: sourceCanvas, half, revision, redrawHalf()
</script>

<div class="h-full w-full border border-zinc-800 bg-black">
  <canvas
    class="block h-full w-full rounded object-contain shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    bind:this={viewCanvas}
  ></canvas>
</div>
