<script lang="ts">
  import Presenter from "./routes/Presenter.svelte";
  import Viewer from "./routes/Viewer.svelte";

  const mode = new URLSearchParams(document.location.search).get("mode");
</script>

{#if mode === "viewer"}
  <Viewer></Viewer>
{:else}
  <Presenter />
{/if}
