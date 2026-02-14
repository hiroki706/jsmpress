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
</script>

<header class="header">
  <label class="file-input">
    PDFを開く
    <input type="file" accept="application/pdf" on:change={handleFileInput} />
  </label>
  <button type="button" disabled={!canGoPrev} on:click={onGoPrev}>前へ</button>
  <button type="button" disabled={!canGoNext} on:click={onGoNext}>次へ</button>
  <button type="button" on:click={onOpenAudience}>共有タブを開く</button>
</header>
