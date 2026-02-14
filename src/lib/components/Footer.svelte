<script lang="ts">
  export let currentPage = 0
  export let totalPages = 0
</script>

<footer class="footer">
  {#if totalPages > 0}
    <span>{currentPage} / {totalPages}</span>
  {:else}
    <span>PDFを読み込んでください</span>
  {/if}
</footer>
