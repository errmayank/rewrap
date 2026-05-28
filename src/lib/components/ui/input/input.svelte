<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    class: className,
    type = "text",
    ref = $bindable(null),
    ...restProps
  }: WithElementRef<HTMLInputAttributes, HTMLInputElement> = $props();
</script>

<input
  bind:this={ref}
  data-slot="input"
  class={cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-7 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    className,
  )}
  {type}
  {...restProps}
/>
