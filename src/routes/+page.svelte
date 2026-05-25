<script lang="ts">
  import {
    CheckIcon,
    CopySimpleIcon,
    MinusIcon,
    MoonIcon,
    PlusIcon,
    SunIcon,
  } from "phosphor-svelte";
  import { toggleMode } from "mode-watcher";

  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
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

  function decreaseWidth() {
    widthInput = String(Math.max(1, lineWidth - 1));
  }

  function increaseWidth() {
    widthInput = String(lineWidth + 1);
  }

  function clearInput() {
    inputText = "";
    hasCopied = false;
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
      <h1 class="select-none text-lg font-semibold tracking-normal">Rewrap</h1>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        title="Toggle theme"
        onclick={toggleMode}
      >
        <SunIcon class="size-[1.2rem] dark:hidden" aria-hidden="true" />
        <MoonIcon class="hidden size-[1.2rem] dark:block" aria-hidden="true" />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </header>

    <section class="flex min-h-0 flex-1 flex-col gap-4 py-4">
      <div class="flex min-h-80 flex-1 flex-col gap-3">
        <div class="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <span class="text-sm leading-none font-medium select-none">Input</span>

          <div class="flex flex-wrap items-center gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm leading-none font-medium select-none">Width</span>
              <div class="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="rounded-r-none"
                  aria-label="Decrease width"
                  title="Decrease width"
                  disabled={lineWidth <= 1}
                  onclick={decreaseWidth}
                >
                  <MinusIcon class="size-4" aria-hidden="true" />
                </Button>

                <Input
                  class="-ml-px w-16 rounded-none text-center font-mono"
                  id="line-width"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  type="number"
                  value={widthInput}
                  oninput={handleWidthInput}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="-ml-px rounded-l-none"
                  aria-label="Increase width"
                  title="Increase width"
                  onclick={increaseWidth}
                >
                  <PlusIcon class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <Button
              type="button"
              class="w-20 font-normal"
              aria-label="Clear input"
              title="Clear input"
              disabled={inputText === ""}
              onclick={clearInput}
            >
              Clear
            </Button>
          </div>
        </div>

        <Textarea
          class="min-h-0 flex-1 resize-none bg-card px-4 py-3 font-mono leading-6"
          id="input-text"
          value={inputText}
          oninput={handleInputText}
          spellcheck="false"
          placeholder="Text to wrap..."
        />
      </div>

      <div class="flex min-h-80 flex-1 flex-col gap-3">
        <div class="flex min-h-9 items-center justify-between gap-3">
          <span class="text-sm leading-none font-medium select-none">Output</span>

          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-muted-foreground">{outputLineCount} lines</span>

            <Button
              type="button"
              size="icon"
              aria-label={hasCopied ? "Copied output" : "Copy output"}
              title={hasCopied ? "Copied output" : "Copy output"}
              disabled={rewrappedText === ""}
              onclick={copyOutput}
            >
              {#if hasCopied}
                <CheckIcon class="size-4.5" aria-hidden="true" />
              {:else}
                <CopySimpleIcon class="size-4.5" aria-hidden="true" />
              {/if}
            </Button>
          </div>
        </div>

        <Textarea
          class="min-h-0 flex-1 resize-none bg-muted/30 px-4 py-3 font-mono leading-6"
          id="output-text"
          readonly
          value={rewrappedText}
          spellcheck="false"
        />
      </div>
    </section>
  </div>
</main>
