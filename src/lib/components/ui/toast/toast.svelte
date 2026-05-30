<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { fly } from "svelte/transition";
  import { WarningCircleIcon, XIcon } from "phosphor-svelte";

  import { cn } from "$lib/utils.js";

  type ToastVariant = "default" | "destructive";
  type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
    children?: Snippet;
    onClose?: () => void;
    variant?: ToastVariant;
  };

  let {
    children,
    class: className,
    onClose,
    variant = "default",
    ...restProps
  }: ToastProps = $props();
</script>

<div
  data-slot="toast"
  class={cn(
    "bg-popover text-popover-foreground pointer-events-auto relative flex min-h-7 w-fit max-w-[calc(100%-1rem)] items-start gap-2 rounded-md border border-border py-1 text-xs shadow-md",
    onClose ? "pl-3 pr-8" : "px-3",
    className,
  )}
  role={variant === "destructive" ? "alert" : "status"}
  in:fly={{ y: "100%", opacity: 0.8, duration: 400 }}
  out:fly={{ y: "100%", opacity: 0, duration: 150 }}
  {...restProps}
>
  {#if variant === "destructive"}
    <WarningCircleIcon class="text-destructive mt-px size-4 shrink-0" aria-hidden="true" />
  {/if}

  <div class="min-w-0 flex-1 leading-5">
    {@render children?.()}
  </div>

  {#if onClose}
    <button
      type="button"
      class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1 right-1.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2"
      aria-label="Dismiss notification"
      title="Dismiss notification"
      onclick={onClose}
    >
      <XIcon class="size-3.5" aria-hidden="true" />
    </button>
  {/if}
</div>
