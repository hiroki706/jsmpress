<script lang="ts">
  type Props = {
    canGoPrev: boolean;
    canGoNext: boolean;
    onOpenPdf: (file: File) => void;
    onGoPrev: () => void;
    onGoNext: () => void;
    onOpenAudience: () => void;
  };

  export let canGoPrev: Props["canGoPrev"];
  export let canGoNext: Props["canGoNext"];
  export let onOpenPdf: Props["onOpenPdf"];
  export let onGoPrev: Props["onGoPrev"];
  export let onGoNext: Props["onGoNext"];
  export let onOpenAudience: Props["onOpenAudience"];

  function handleFileInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onOpenPdf(file);
    input.value = "";
  }

  const controlClass =
    "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45"
</script>

<header class="flex items-center gap-2">
  <label class={`${controlClass} cursor-pointer`}>
    PDFを開く
    <input
      class="hidden"
      type="file"
      accept="application/pdf"
      on:change={handleFileInput}
    />
  </label>
  <button class={controlClass} type="button" disabled={!canGoPrev} on:click={onGoPrev}
    >前へ</button
  >
  <button class={controlClass} type="button" disabled={!canGoNext} on:click={onGoNext}
    >次へ</button
  >
  <button class={controlClass} type="button" on:click={onOpenAudience}
    >共有タブを開く</button
  >
</header>
