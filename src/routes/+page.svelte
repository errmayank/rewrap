<script lang="ts">
  import { CheckIcon, ClipboardIcon, MoonIcon, SunIcon } from "phosphor-svelte";
  import { toggleMode } from "mode-watcher";

  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { DEFAULT_LINE_WIDTH, rewrap } from "$lib/rewrap";

  let inputText = $state("");
  let widthInput = $state(String(DEFAULT_LINE_WIDTH));
  let hasCopied = $state(false);
  let copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

  const parsedLineWidth = $derived(Number(widthInput));
  const lineWidth = $derived(
    Number.isInteger(parsedLineWidth) && parsedLineWidth > 0 ? parsedLineWidth : DEFAULT_LINE_WIDTH,
  );
  const rewrappedText = $derived(rewrap(inputText, lineWidth));
  const outputLineCount = $derived(rewrappedText === "" ? 0 : rewrappedText.split("\n").length);

  $effect(() => {
    return () => {
      if (copyResetTimeout) {
        clearTimeout(copyResetTimeout);
      }
    };
  });

  function handleInputText(event: Event) {
    inputText = (event.currentTarget as HTMLTextAreaElement).value;
  }

  function handleWidthInput(event: Event) {
    widthInput = (event.currentTarget as HTMLInputElement).value;
  }

  async function copyOutput() {
    if (rewrappedText === "") {
      return;
    }

    await navigator.clipboard.writeText(rewrappedText);
    hasCopied = true;

    if (copyResetTimeout) {
      clearTimeout(copyResetTimeout);
    }

    copyResetTimeout = setTimeout(() => {
      hasCopied = false;
    }, 1600);
  }
</script>

<svelte:head>
  <title>Rewrap</title>
</svelte:head>

<main class="min-h-dvh bg-background text-foreground">
  <div class="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
    <header class="flex h-12 items-center justify-between gap-4">
      <h1 class="text-lg font-semibold tracking-normal">Rewrap</h1>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        title="Toggle theme"
        onclick={toggleMode}
      >
        <SunIcon
          class="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          aria-hidden="true"
        />
        <MoonIcon
          class="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          aria-hidden="true"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </header>

    <section class="flex min-h-0 flex-1 flex-col gap-4 py-4">
      <div class="flex min-h-80 flex-1 flex-col gap-3">
        <div class="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <Label for="input-text">Input</Label>

          <Label class="flex-wrap" for="line-width">
            Width
            <Input
              class="w-24"
              id="line-width"
              inputmode="numeric"
              min="1"
              step="1"
              type="number"
              value={widthInput}
              oninput={handleWidthInput}
            />
          </Label>
        </div>

        <Textarea
          class="min-h-0 flex-1 resize-none bg-card px-4 py-3 leading-6"
          id="input-text"
          value={inputText}
          oninput={handleInputText}
          spellcheck="false"
          placeholder="Paste text to wrap..."
        />
      </div>

      <div class="flex min-h-80 flex-1 flex-col gap-3">
        <div class="flex min-h-9 items-center justify-between gap-3">
          <div class="flex items-baseline gap-3">
            <Label for="output-text">Output</Label>
            <span class="text-xs text-muted-foreground">{outputLineCount} lines</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={hasCopied ? "Copied output" : "Copy output"}
            title={hasCopied ? "Copied output" : "Copy output"}
            disabled={rewrappedText === ""}
            onclick={copyOutput}
          >
            {#if hasCopied}
              <CheckIcon size={18} aria-hidden="true" />
            {:else}
              <ClipboardIcon size={18} aria-hidden="true" />
            {/if}
          </Button>
        </div>

        <Textarea
          class="min-h-0 flex-1 resize-none bg-muted/30 px-4 py-3 leading-6"
          id="output-text"
          readonly
          value={rewrappedText}
          spellcheck="false"
        />
      </div>
    </section>
  </div>
</main>
