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
  const audienceUrl = new URL("/audience", window.location.origin);
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
      if (!pdf) return;
      void postCurrentTopFrame(renderSequence);
    };

    window.addEventListener("keydown", onKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", onKeydown);
    channel?.close();
    void pdf?.destroy();
  });
</script>

<div class="grid h-screen w-screen grid-rows-[auto_1fr_auto] gap-2 bg-zinc-950 p-2 text-zinc-100">
  <Header
    canGoPrev={canGoPrev()}
    canGoNext={canGoNext()}
    onOpenPdf={openPdf}
    onGoPrev={goPrev}
    onGoNext={goNext}
    onOpenAudience={openAudienceTab}
  />

  <main class="grid min-h-0 grid-cols-2 gap-2">
    <section class="min-h-0">
      <CanvasHalfView
        sourceCanvas={currentPageCanvas}
        half="bottom"
        revision={currentRevision}
      />
    </section>
    <section class="grid min-h-0 grid-rows-2 gap-2">
      <div class="min-h-0">
        <CanvasHalfView
          sourceCanvas={currentPageCanvas}
          half="top"
          revision={currentRevision}
        />
      </div>
      <div class="min-h-0">
        <CanvasHalfView
          sourceCanvas={nextPageCanvas}
          half="top"
          revision={nextRevision}
        />
      </div>
    </section>
  </main>

  <Footer {currentPage} {totalPages} />

  {#if errorMessage}
    <p class="m-0 text-sm text-rose-300">{errorMessage}</p>
  {/if}
</div>
