<script lang="ts">
  type Props = {
    onOpenPdf: (file: File) => void;
    onOpenAudience: () => void;
    audienceConnected: boolean;
  };

  export let onOpenPdf: Props["onOpenPdf"];
  export let onOpenAudience: Props["onOpenAudience"];
  export let audienceConnected: Props["audienceConnected"] = false;

  function handleFileInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onOpenPdf(file);
    input.value = "";
  }

  let statusClass = "bg-zinc-500";
  $: statusClass = audienceConnected
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]"
    : "bg-zinc-500";
</script>

<header
  class="flex items-center gap-3 border-b border-white/10 bg-[#17171f] px-4 py-2.5"
>
  <h1 class="text-xs font-medium tracking-[0.08em] text-zinc-400 uppercase">
    Presenter View
  </h1>
  <label
    class="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-indigo-400/50 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:border-indigo-300 hover:bg-indigo-400/20"
  >
    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    <span>PDFを開く</span>
    <input
      class="hidden"
      type="file"
      accept="application/pdf"
      on:change={handleFileInput}
    />
  </label>
  <div class="ml-auto flex items-center gap-2 text-xs text-zinc-400">
    <span class={`h-1.5 w-1.5 rounded-full ${statusClass}`}></span>
    <span>{audienceConnected ? "共有画面 接続中" : "共有画面 未接続"}</span>
  </div>
  <button
    class="rounded-md border border-transparent bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
    type="button"
    on:click={onOpenAudience}
  >
    共有画面を開く
  </button>
</header>
