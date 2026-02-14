<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import CanvasHalfView from "../lib/components/CanvasHalfView.svelte";
  import Footer from "../lib/components/Footer.svelte";
  import Header from "../lib/components/Header.svelte";
  import {
    clampPage,
    cropHalfToBitmap,
    loadPdfDocument,
    renderPageToCanvas,
    type PdfDocument,
  } from "../lib/pdf/pdf";
  import {
    createPresentationChannel,
    isRequestSyncMessage,
    postFrameMessage,
    type PresentationMessage,
  } from "../lib/sync/channel";

  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("sid") ?? crypto.randomUUID();
  const audienceUrl = new URL("/#/audience", window.location.origin);
  audienceUrl.searchParams.set("sid", sessionId);

  let pdf: PdfDocument | null = null;
  let totalPages = 0;
  let currentPage = 1;
  let errorMessage = "";

  let currentPageCanvas: HTMLCanvasElement | null = null;
  let nextPageCanvas: HTMLCanvasElement | null = null;
  let currentRevision = 0;
  let nextRevision = 0;

  let channel: BroadcastChannel | null = null;
  let renderSequence = 0;
  let audienceConnected = false;
  let lastAudiencePingAt = 0;
  let audienceMonitorId: number | null = null;

  let timerRunning = false;
  let timerSeconds = 0;
  let timerId: number | null = null;
  let elapsedLabel = "00:00";

  function formatElapsed(totalSeconds: number): string {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  $: elapsedLabel = formatElapsed(timerSeconds);

  function canGoPrev(): boolean {
    return pdf !== null && currentPage > 1;
  }

  function canGoNext(): boolean {
    return pdf !== null && currentPage < totalPages;
  }

  async function openPdf(file: File): Promise<void> {
    try {
      errorMessage = "";
      if (pdf) await pdf.destroy();
      pdf = await loadPdfDocument(file);
      totalPages = pdf.numPages;
      currentPage = 1;
      await renderVisiblePages();
    } catch (error) {
      errorMessage = `PDFの読み込みに失敗しました: ${String(error)}`;
    }
  }

  async function goToPage(page: number): Promise<void> {
    if (!pdf) return;
    const next = clampPage(page, totalPages);
    if (next === currentPage) return;
    currentPage = next;
    await renderVisiblePages();
  }

  async function goPrev(): Promise<void> {
    await goToPage(currentPage - 1);
  }

  async function goNext(): Promise<void> {
    await goToPage(currentPage + 1);
  }

  function openAudienceTab(): void {
    window.open(audienceUrl.toString(), "_blank", "noopener,noreferrer");
  }

  function toggleTimer(): void {
    if (timerRunning) {
      timerRunning = false;
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
      return;
    }

    timerRunning = true;
    timerId = window.setInterval(() => {
      timerSeconds += 1;
    }, 1000);
  }

  function resetTimer(): void {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    timerRunning = false;
    timerSeconds = 0;
  }

  function ensureSourceCanvases(): void {
    if (!currentPageCanvas)
      currentPageCanvas = document.createElement("canvas");
    if (!nextPageCanvas) nextPageCanvas = document.createElement("canvas");
  }

  function clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function renderVisiblePages(): Promise<void> {
    if (!pdf) return;
    ensureSourceCanvases();
    if (!currentPageCanvas || !nextPageCanvas) return;

    const sequence = ++renderSequence;
    await renderPageToCanvas(pdf, currentPage, currentPageCanvas, 2);
    if (sequence !== renderSequence) return;
    currentRevision += 1;

    if (currentPage < totalPages) {
      await renderPageToCanvas(pdf, currentPage + 1, nextPageCanvas, 2);
    } else {
      clearCanvas(nextPageCanvas);
    }
    if (sequence !== renderSequence) return;
    nextRevision += 1;

    await postCurrentTopFrame(sequence);
  }

  async function postCurrentTopFrame(sequence: number): Promise<void> {
    if (!channel || !currentPageCanvas || sequence !== renderSequence) return;
    const bitmap = await cropHalfToBitmap(currentPageCanvas, "top");
    if (sequence !== renderSequence) {
      bitmap.close();
      return;
    }
    postFrameMessage(channel, sessionId, currentPage, totalPages, bitmap);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!pdf) return;
    const target = event.target as HTMLElement | null;
    const isTyping =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable;
    if (isTyping) return;

    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      void goNext();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      void goPrev();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      void goToPage(1);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      void goToPage(totalPages);
    }
  }

  onMount(() => {
    channel = createPresentationChannel();
    channel.onmessage = (event: MessageEvent<PresentationMessage>) => {
      const message = event.data;
      if (!isRequestSyncMessage(message)) return;
      if (message.sessionId !== sessionId) return;
      lastAudiencePingAt = Date.now();
      audienceConnected = true;
      if (!pdf) return;
      void postCurrentTopFrame(renderSequence);
    };

    audienceMonitorId = window.setInterval(() => {
      if (lastAudiencePingAt === 0) {
        audienceConnected = false;
        return;
      }
      audienceConnected = Date.now() - lastAudiencePingAt < 4000;
    }, 1000);

    window.addEventListener("keydown", onKeydown);
    toggleTimer();
  });

  onDestroy(() => {
    window.removeEventListener("keydown", onKeydown);
    if (timerId !== null) window.clearInterval(timerId);
    if (audienceMonitorId !== null) window.clearInterval(audienceMonitorId);
    channel?.close();
    void pdf?.destroy();
  });
</script>

<div
  class="flex h-screen w-screen flex-col overflow-hidden bg-[#0f0f13] text-[#e8e8f0]"
>
  <Header
    onOpenPdf={openPdf}
    onOpenAudience={openAudienceTab}
    {audienceConnected}
  />

  <main class="grid min-h-0 flex-1 grid-cols-[1fr_340px] grid-rows-2 gap-3 p-3">
    <section
      class="row-span-2 flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-[#17171f]"
    >
      <div
        class="border-b border-white/10 px-3.5 py-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase"
      >
        スピーカーノート
      </div>
      <div class="min-h-0 flex-1 p-1.5">
        <CanvasHalfView
          sourceCanvas={currentPageCanvas}
          half="bottom"
          revision={currentRevision}
        />
      </div>
    </section>

    <section
      class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-[#17171f]"
    >
      <div
        class="border-b border-white/10 px-3.5 py-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase"
      >
        現在のスライド
      </div>
      <div class="relative min-h-0 flex-1 p-1.5">
        <CanvasHalfView
          sourceCanvas={currentPageCanvas}
          half="top"
          revision={currentRevision}
        />
        {#if !pdf}
          <div
            class="pointer-events-none absolute inset-0 grid place-items-center text-sm text-zinc-500"
          >
            PDFファイルを開いてください
          </div>
        {/if}
      </div>
    </section>

    <section
      class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-[#17171f]"
    >
      <div
        class="border-b border-white/10 px-3.5 py-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase"
      >
        次のスライド
      </div>
      <div class="min-h-0 flex-1 p-1.5">
        <CanvasHalfView
          sourceCanvas={nextPageCanvas}
          half="top"
          revision={nextRevision}
        />
      </div>
    </section>
  </main>

  <Footer
    {currentPage}
    {totalPages}
    {elapsedLabel}
    {timerRunning}
    onToggleTimer={toggleTimer}
    onResetTimer={resetTimer}
    onPrev={goPrev}
    onNext={goNext}
    canGoPrev={canGoPrev()}
    canGoNext={canGoNext()}
  />

  {#if errorMessage}
    <p
      class="absolute right-4 bottom-20 m-0 rounded bg-rose-400/10 px-3 py-1.5 text-sm text-rose-300"
    >
      {errorMessage}
    </p>
  {/if}
</div>
