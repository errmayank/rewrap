<script lang="ts">
  import { CheckIcon, CircleHalfIcon, CopySimpleIcon, MinusIcon, PlusIcon } from "phosphor-svelte";
  import { toggleMode } from "mode-watcher";

  import { Github, Rewrap } from "$lib/components/assets/images/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Toast, ToastViewport } from "$lib/components/ui/toast/index.js";
  import { rewrapDatabase, type RewrapSnapshot } from "$lib/persistence";
  import {
    DEFAULT_WRAP_WIDTH,
    MAX_WRAP_WIDTH,
    MIN_WRAP_WIDTH,
    parseWrapWidth,
    rewrap,
  } from "$lib/rewrap";

  type ErrorToast = "snapshot_load_error" | "snapshot_save_error" | "copy_to_clipboard_error";

  let textInput = $state("");
  let widthInput = $state(String(DEFAULT_WRAP_WIDTH));
  let acceptedWrapWidth = $state(DEFAULT_WRAP_WIDTH);
  let snapshotUpdatedAt = $state<number | null>(null);
  let isSnapshotLoaded = $state(false);
  let errorToasts = $state<ErrorToast[]>([]);
  let outputCopied = $state(false);
  let copyResetTimeout: ReturnType<typeof setTimeout> | null = null;

  const wrapWidth = $derived(parseWrapWidth(widthInput) ?? acceptedWrapWidth);
  const rewrappedText = $derived(rewrap(textInput, wrapWidth));
  const outputLineCount = $derived(rewrappedText === "" ? 0 : rewrappedText.split("\n").length);

  $effect(() => {
    const controller = new AbortController();
    const subscription = rewrapDatabase.watchSnapshot({
      next(snapshot) {
        restoreSnapshot(snapshot);
        isSnapshotLoaded = true;
        dismissErrorToast("snapshot_load_error");
      },
      error(error) {
        console.error("Failed to watch Rewrap snapshot", error);
        isSnapshotLoaded = true;
        showErrorToast("snapshot_load_error");
      },
    });

    window.addEventListener("pagehide", flushPendingSnapshot, { signal: controller.signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          flushPendingSnapshot();
        }
      },
      { signal: controller.signal },
    );

    return () => {
      subscription.unsubscribe();
      controller.abort();
      flushPendingSnapshot();

      if (copyResetTimeout) {
        clearTimeout(copyResetTimeout);
      }
    };
  });

  function restoreSnapshot(snapshot: RewrapSnapshot | null) {
    if (snapshot === null) {
      return;
    }

    if (snapshotUpdatedAt !== null && snapshot.updatedAt < snapshotUpdatedAt) {
      return;
    }

    snapshotUpdatedAt = snapshot.updatedAt;

    if (snapshot.text === textInput && snapshot.wrapWidth === acceptedWrapWidth) {
      return;
    }

    textInput = snapshot.text;
    acceptedWrapWidth = snapshot.wrapWidth;
    widthInput = String(snapshot.wrapWidth);
  }

  function saveSnapshot(options?: { immediate?: boolean }) {
    try {
      const snapshot = rewrapDatabase.saveSnapshot(textInput, acceptedWrapWidth, {
        ...options,
        onError: handleSnapshotSaveError,
        onSuccess: () => {
          dismissErrorToast("snapshot_save_error");
        },
      });

      snapshotUpdatedAt = Math.max(snapshotUpdatedAt ?? 0, snapshot.updatedAt);
    } catch (error) {
      handleSnapshotSaveError(error);
    }
  }

  function flushPendingSnapshot() {
    void rewrapDatabase
      .flushPendingSnapshot()
      .then(() => {
        dismissErrorToast("snapshot_save_error");
      })
      .catch(handleSnapshotSaveError);
  }

  function handleSnapshotSaveError(error: unknown) {
    console.error("Failed to save Rewrap snapshot", error);
    showErrorToast("snapshot_save_error");
  }

  function handleTextInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
    textInput = event.currentTarget.value;
    saveSnapshot();
  }

  function handleWidthInput(event: Event & { currentTarget: HTMLInputElement }) {
    widthInput = event.currentTarget.value;
  }

  function handleWidthBlur() {
    const nextWrapWidth = wrapWidth;
    widthInput = String(nextWrapWidth);

    if (nextWrapWidth === acceptedWrapWidth) {
      flushPendingSnapshot();
      return;
    }

    acceptedWrapWidth = nextWrapWidth;
    saveSnapshot({ immediate: true });
  }

  function setWrapWidth(nextWrapWidth: number) {
    const nextValidWrapWidth = parseWrapWidth(nextWrapWidth);

    if (nextValidWrapWidth === null) {
      return;
    }

    widthInput = String(nextValidWrapWidth);
    acceptedWrapWidth = nextValidWrapWidth;
    saveSnapshot();
  }

  function clearInput() {
    textInput = "";
    outputCopied = false;
    saveSnapshot();
  }

  async function copyOutput() {
    if (rewrappedText === "") {
      return;
    }

    try {
      await navigator.clipboard.writeText(rewrappedText);
      outputCopied = true;
      dismissErrorToast("copy_to_clipboard_error");
    } catch (error) {
      console.error("Failed to copy Rewrap output", error);
      showErrorToast("copy_to_clipboard_error");
      outputCopied = false;
      return;
    }

    if (copyResetTimeout) {
      clearTimeout(copyResetTimeout);
    }

    copyResetTimeout = setTimeout(() => {
      outputCopied = false;
    }, 1600);
  }

  function showErrorToast(errorToast: ErrorToast) {
    if (errorToasts.includes(errorToast)) {
      return;
    }

    errorToasts = [...errorToasts, errorToast];
  }

  function dismissErrorToast(errorToast: ErrorToast) {
    errorToasts = errorToasts.filter(visibleErrorToast => visibleErrorToast !== errorToast);
  }

  function getErrorToastMessage(errorToast: ErrorToast) {
    switch (errorToast) {
      case "snapshot_load_error":
        return "Unable to restore saved changes.";
      case "snapshot_save_error":
        return "Unable to save changes.";
      case "copy_to_clipboard_error":
        return "Unable to copy to clipboard.";
      default: {
        const unhandledErrorToast: never = errorToast;
        return unhandledErrorToast;
      }
    }
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
              <Label class="sr-only" for="wrap-width">Width</Label>
              <div class="flex h-7 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="rounded-r-none border-r-0 focus-visible:z-10"
                  aria-label="Decrease wrap width"
                  title="Decrease wrap width"
                  disabled={!isSnapshotLoaded || wrapWidth <= MIN_WRAP_WIDTH}
                  onclick={() => setWrapWidth(wrapWidth - MIN_WRAP_WIDTH)}
                >
                  <MinusIcon class="size-4" aria-hidden="true" />
                </Button>

                <Input
                  id="wrap-width"
                  class="rounded-none text-center font-mono focus-visible:z-10 [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  style={`width: min(calc(${Math.max(widthInput.length, String(DEFAULT_WRAP_WIDTH).length)}ch + 2.25rem), 12rem)`}
                  type="text"
                  disabled={!isSnapshotLoaded}
                  value={isSnapshotLoaded ? widthInput : ""}
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
                  disabled={!isSnapshotLoaded || wrapWidth >= MAX_WRAP_WIDTH}
                  onclick={() => setWrapWidth(wrapWidth + MIN_WRAP_WIDTH)}
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
              disabled={!isSnapshotLoaded || textInput === ""}
              onclick={clearInput}
            >
              Clear
            </Button>
          </div>
        </div>

        <Textarea
          id="input-text"
          value={textInput}
          disabled={!isSnapshotLoaded}
          onblur={flushPendingSnapshot}
          oninput={handleTextInput}
          spellcheck="false"
          placeholder={isSnapshotLoaded ? "Text to wrap..." : ""}
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
              aria-label={outputCopied ? "Copied output" : "Copy output"}
              title={outputCopied ? "Copied output" : "Copy output"}
              disabled={!isSnapshotLoaded || rewrappedText === ""}
              onclick={copyOutput}
            >
              {#if outputCopied}
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
          disabled={!isSnapshotLoaded}
          value={rewrappedText}
          spellcheck="false"
          wrap="off"
        />
      </div>
    </section>
  </div>
</main>

<ToastViewport items={errorToasts}>
  {#snippet children(errorToast)}
    <Toast variant="destructive" onClose={() => dismissErrorToast(errorToast)}>
      {getErrorToastMessage(errorToast)}
    </Toast>
  {/snippet}
</ToastViewport>
