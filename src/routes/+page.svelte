<script lang="ts">
  import { CheckIcon, CircleHalfIcon, CopySimpleIcon, MinusIcon, PlusIcon } from "phosphor-svelte";
  import { toggleMode } from "mode-watcher";

  import { Github, Rewrap } from "$lib/components/assets/images/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
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
  const wrapWidthInputWidth = $derived(
    `calc(${Math.max(widthInput.length, String(DEFAULT_LINE_WIDTH).length)}ch + 2.25rem)`,
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

  function handleWidthBlur() {
    widthInput = String(lineWidth);
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

<main class="h-svh bg-background text-foreground">
  <div class="flex h-svh flex-col">
    <header class="border-b border-border/40">
      <div
        class="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <h1>
          <Rewrap aria-hidden="true" />
          <span class="sr-only">Rewrap</span>
        </h1>

        <div class="flex items-center gap-2">
          <a
            class={buttonVariants({ variant: "ghost", size: "icon" })}
            href="https://github.com/errmayank/rewrap"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            title="GitHub repository"
          >
            <Github aria-hidden="true" />
          </a>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            title="Toggle theme"
            onclick={toggleMode}
          >
            <CircleHalfIcon class="size-4.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>

    <section class="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 p-4 sm:p-6">
      <div class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="flex min-h-7 flex-wrap items-center justify-between gap-2">
          <Label for="input-text">Input</Label>

          <div class="flex flex-wrap items-center gap-1.5">
            <div class="flex flex-wrap items-center gap-1.5">
              <Label class="sr-only" for="line-width">Width</Label>
              <div class="flex h-7 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="rounded-r-none border-r-0 focus-visible:z-10"
                  aria-label="Decrease wrap width"
                  title="Decrease wrap width"
                  disabled={lineWidth <= 1}
                  onclick={decreaseWidth}
                >
                  <MinusIcon class="size-4" aria-hidden="true" />
                </Button>

                <Input
                  id="line-width"
                  class="rounded-none text-center font-mono focus-visible:z-10 [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  style={`width: ${wrapWidthInputWidth}`}
                  type="number"
                  value={widthInput}
                  onblur={handleWidthBlur}
                  oninput={handleWidthInput}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="rounded-l-none border-l-0 focus-visible:z-10"
                  aria-label="Increase wrap width"
                  title="Increase wrap width"
                  onclick={increaseWidth}
                >
                  <PlusIcon class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              class="font-mono uppercase text-destructive hover:text-destructive"
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
          id="input-text"
          value={inputText}
          oninput={handleInputText}
          spellcheck="false"
          placeholder="Text to wrap..."
          wrap="off"
        />
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="flex min-h-7 items-center justify-between gap-2">
          <Label for="output-text">Output</Label>

          <div class="flex items-center gap-2">
            <span
              id="output-line-count"
              class="font-mono text-xs leading-none text-muted-foreground uppercase"
            >
              {outputLineCount} lines
            </span>

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
                <CheckIcon class="size-4" aria-hidden="true" />
              {:else}
                <CopySimpleIcon class="size-4" aria-hidden="true" />
              {/if}
            </Button>
          </div>
        </div>

        <Textarea
          id="output-text"
          aria-describedby="output-line-count"
          readonly
          value={rewrappedText}
          spellcheck="false"
          wrap="off"
        />
      </div>
    </section>
  </div>
</main>
