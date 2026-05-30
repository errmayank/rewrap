<script lang="ts" generics="Item extends string">
  import type { Snippet } from "svelte";
  import { flip } from "svelte/animate";

  let { children, items }: { children?: Snippet<[Item]>; items: Item[] } = $props();
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-6 z-50 sm:bottom-8">
  <div class="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 sm:px-6">
    {#each items as item (item)}
      <div class="flex w-full justify-center" animate:flip={{ duration: 400 }}>
        {@render children?.(item)}
      </div>
    {/each}
  </div>
</div>
