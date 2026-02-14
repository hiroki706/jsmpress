<script lang="ts">
  export let currentPage = 0
  export let totalPages = 0
</script>

<footer
  class="flex min-h-10 items-center justify-center border-t border-zinc-800 text-sm text-zinc-300"
>
  {#if totalPages > 0}
    <span>{currentPage} / {totalPages}</span>
  {:else}
    <span>PDFを読み込んでください</span>
  {/if}
</footer>
