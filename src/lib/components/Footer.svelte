<script lang="ts">
  type Props = {
    currentPage: number;
    totalPages: number;
    elapsedLabel: string;
    timerRunning: boolean;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onPrev: () => void;
    onNext: () => void;
    canGoPrev: boolean;
    canGoNext: boolean;
  };

  export let currentPage: Props["currentPage"] = 0;
  export let totalPages: Props["totalPages"] = 0;
  export let elapsedLabel: Props["elapsedLabel"] = "00:00";
  export let timerRunning: Props["timerRunning"] = false;
  export let onToggleTimer: Props["onToggleTimer"];
  export let onResetTimer: Props["onResetTimer"];
  export let onPrev: Props["onPrev"];
  export let onNext: Props["onNext"];
  export let canGoPrev: Props["canGoPrev"] = false;
  export let canGoNext: Props["canGoNext"] = false;

  let progress = 0;
  $: progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
</script>

<footer
  class="grid grid-cols-4 items-center gap-4 border-t border-white/10 bg-[#17171f] px-4 py-2.5"
>
  <div class="flex flex-col gap-0.5">
    <span
      class="text-[10px] font-semibold tracking-[0.1em] text-zinc-500 uppercase"
      >スライド番号</span
    >
    <span
      class="font-mono text-2xl font-semibold tracking-tight text-indigo-300"
    >
      {totalPages > 0 ? `${currentPage} / ${totalPages}` : "—"}
    </span>
  </div>

  <div class="flex flex-col gap-0.5">
    <span
      class="text-[10px] font-semibold tracking-[0.1em] text-zinc-500 uppercase"
      >経過時間</span
    >
    <div class="flex items-center gap-2">
      <span
        class="font-mono text-2xl font-semibold tracking-tight text-emerald-300"
      >
        {elapsedLabel}
      </span>
      <div class="flex items-center gap-1.5">
        <button
          class={`flex h-7 w-7 items-center font-mono justify-center rounded-md border text-xs transition ${
            timerRunning
              ? "border-white/10 hover:bg-emerald-500/10"
              : "border-white/10 bg-[#1e1e2a] text-zinc-300 hover:bg-[#252535]"
          }`}
          type="button"
          on:click={onToggleTimer}
          title="開始/停止"
        >
          {timerRunning ? "⏸" : "▶"}
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#1e1e2a] text-xs text-zinc-300 transition hover:border-rose-400 hover:text-rose-300"
          type="button"
          on:click={onResetTimer}
          title="リセット"
        >
          ↺
        </button>
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <span
      class="text-[10px] font-semibold tracking-[0.1em] text-zinc-500 uppercase"
      >スライド進捗</span
    >
    <div class="h-1 w-36 overflow-hidden rounded bg-[#252535]">
      <div
        class="h-full rounded bg-indigo-400 transition-[width] duration-200"
        style={`width: ${progress}%`}
      ></div>
    </div>
  </div>

  <div class="flex items-center justify-end gap-2.5">
    <button
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1e1e2a] text-lg text-zinc-200 transition hover:bg-[#252535] disabled:cursor-not-allowed disabled:opacity-30"
      type="button"
      disabled={!canGoPrev}
      on:click={onPrev}
      aria-label="前のスライド"
    >
      ◀
    </button>
    <button
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1e1e2a] text-lg text-zinc-200 transition hover:bg-[#252535] disabled:cursor-not-allowed disabled:opacity-30"
      type="button"
      disabled={!canGoNext}
      on:click={onNext}
      aria-label="次のスライド"
    >
      ▶
    </button>
  </div>
</footer>
