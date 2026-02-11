<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createDeckChannel } from "../lib/sync";
  import { loadPdfFromUrl, renderTopOnly } from "../lib/pdf";
  import type { PDFDocumentProxy } from "pdfjs-dist";

  let host: HTMLDivElement;

  let pdfDoc: PDFDocumentProxy | null = null;
  let pageIndex = 0;

  const ch = createDeckChannel();
  const off = ch.on(async (msg) => {
    console.log(msg);
    if (msg.type === "state") {
      pageIndex = msg.pageIndex;
      await render();
    }
  });

  async function render() {
    if (!pdfDoc || !host) return;
    const w = host.clientWidth || window.innerWidth;
    const page = await pdfDoc.getPage(pageIndex + 1);
    const top = await renderTopOnly(page, w);
    host.innerHTML = "";
    top.style.display = "block";
    top.style.width = "100%";
    top.style.height = "auto";
    host.appendChild(top);
  }

  onMount(async () => {
    const params = new URLSearchParams(document.location.search);
    const src = params.get("src")!;
    pdfDoc = await loadPdfFromUrl(src!);
    pageIndex = parseInt(params.get("page")!);
    await render();
  });

  onDestroy(() => {
    off();
    ch.close();
  });
</script>

<div class="viewer" bind:this={host}></div>

<style>
  .viewer {
    width: 100vw;
    height: 100vh;
    background: #000;
    overflow: auto;
  }
</style>
