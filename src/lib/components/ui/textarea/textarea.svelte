<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    class: className,
    ref = $bindable(null),
    ...restProps
  }: WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement> = $props();
</script>

<textarea
  bind:this={ref}
  data-slot="textarea"
  class={cn(
    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [scrollbar-color:var(--input)_transparent] scrollbar-thin flex min-h-0 w-full flex-1 resize-none rounded-md border bg-card px-3 py-2 font-mono text-xs leading-6 shadow-xs outline-none overflow-auto focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )}
  {...restProps}
></textarea>
