<script lang="ts">
  import AudienceView from './routes/AudienceView.svelte'
  import PresenterView from './routes/PresenterView.svelte'

  const isAudienceRoute = window.location.pathname.endsWith('/audience')
</script>

{#if isAudienceRoute}
  <AudienceView />
{:else}
  <PresenterView />
{/if}
