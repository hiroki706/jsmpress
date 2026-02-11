<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createDeckChannel } from "../lib/sync";
  import { loadPdfFromUrl, renderSplit50, renderTopOnly } from "../lib/pdf";
  import type { PDFDocumentProxy } from "pdfjs-dist";

  let fileInput: HTMLInputElement;

  let pdfBuf: ArrayBuffer | null = null;
  let pdfDoc: PDFDocumentProxy | null = null;

  let pageIndex = 0;
  let totalPages = 0;

  // hosts
  let curHost: HTMLDivElement;
  let nextHost: HTMLDivElement;
  let notesHost: HTMLDivElement;

  let viewerWin: Window | null = null;

  const ch = createDeckChannel();

  function broadcastState() {
    console.log(pageIndex);
    ch.post({ type: "state", pageIndex, totalPages });
  }

  let objectUrl: string | null = null;

  async function onPickFile() {
    const f = fileInput.files?.[0];
    if (!f) return;

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(f);

    pdfDoc = await loadPdfFromUrl(objectUrl);
    totalPages = pdfDoc.numPages;
    pageIndex = 0;

    await renderAll();
    broadcastState();
  }

  function openViewer() {
    if (!objectUrl) return;

    const url = `/?src=${encodeURIComponent(objectUrl)}&mode=viewer&page=${pageIndex}`;
    if (viewerWin && !viewerWin.closed) {
      viewerWin.focus();
      return;
    }
    viewerWin = window.open(url, "viewer");
    viewerWin?.focus();
  }

  function mountCanvas(host: HTMLDivElement, canvas: HTMLCanvasElement) {
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(canvas);
  }

  async function renderAll() {
    if (!pdfDoc) return;

    // CSS幅（px）を基準にする。まずは単純に host.clientWidth
    const leftWidth = curHost?.clientWidth || 400;
    const rightWidth = notesHost?.clientWidth || 600;

    const curPage = await pdfDoc.getPage(pageIndex + 1);

    // current: top + bottom
    const split = await renderSplit50(curPage, rightWidth);
    // 右はノート（bottom）
    mountCanvas(notesHost, split.bottom);

    // 左上は現在スライド（top）: 左幅に合わせてもう一回 top-only を描く（簡単優先）
    const curTop = await renderTopOnly(curPage, leftWidth);
    mountCanvas(curHost, curTop);

    // next
    if (pageIndex + 1 < totalPages) {
      const nextPage = await pdfDoc.getPage(pageIndex + 2);
      const nextTop = await renderTopOnly(nextPage, leftWidth);
      mountCanvas(nextHost, nextTop);
    } else {
      nextHost.innerHTML = "";
    }
  }

  function next() {
    if (!pdfDoc) return;
    if (pageIndex + 1 >= totalPages) return;
    pageIndex += 1;
    renderAll();
    broadcastState();
  }

  function prev() {
    if (!pdfDoc) return;
    if (pageIndex <= 0) return;
    pageIndex -= 1;
    renderAll();
    broadcastState();
  }

  // ★ viewer-ready handshake
  function onMessage(e: MessageEvent) {
    if (e.origin !== location.origin) return;
    if (e.data?.type === "viewer-ready") {
      if (viewerWin && pdfBuf) {
        viewerWin.postMessage({ type: "pdf", buf: pdfBuf }, location.origin);
        broadcastState();
      }
    }
  }

  function onKeydown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (k === "arrowright" || k === " " || k === "pagedown") {
      e.preventDefault();
      next();
    } else if (k === "arrowleft" || k === "pageup") {
      e.preventDefault();
      prev();
    } else if (k === "f") {
      e.preventDefault();
      openViewer();
    }
  }

  onMount(() => {
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeydown);
    };
  });

  onDestroy(() => ch.close());
</script>

<div class="wrap">
  <div class="header">
    <input
      bind:this={fileInput}
      type="file"
      accept="application/pdf"
      on:change={onPickFile}
    />
    <button on:click={openViewer} disabled={!pdfBuf}>Viewer (F)</button>
    <button on:click={prev} disabled={!pdfDoc || pageIndex === 0}>Prev</button>
    <button on:click={next} disabled={!pdfDoc || pageIndex + 1 >= totalPages}
      >Next</button
    >
    <div class="info">
      {pdfDoc ? `${pageIndex + 1} / ${totalPages}` : "no pdf"}
    </div>
  </div>

  <div class="body">
    <div class="left">
      <div class="panel" bind:this={curHost}></div>
      <div class="panel" bind:this={nextHost}></div>
    </div>
    <div class="panel" bind:this={notesHost}></div>
  </div>
</div>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(250, 250, 250, 0.95);
    border-bottom: 1px solid #ddd;
    padding: 8px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .wrap {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 40% 60%;
    gap: 8px;
    padding: 8px;
    box-sizing: border-box;
  }
  .left {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    min-height: 0;
  }
  .panel {
    overflow: auto; /* hidden だと見えない */
    min-height: 0;
  }

  .info {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
  }
</style>
