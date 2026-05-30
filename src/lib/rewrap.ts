import * as v from "valibot";

export const DEFAULT_WRAP_WIDTH = 72;
export const MIN_WRAP_WIDTH = 1;
export const MAX_WRAP_WIDTH = Number.MAX_SAFE_INTEGER;

const WrapWidthSchema = v.pipe(
  v.union([v.number(), v.pipe(v.string(), v.regex(/^\d+$/), v.toNumber())]),
  v.integer(),
);

export function rewrap(text: string, width = DEFAULT_WRAP_WIDTH): string {
  const wrapWidth = parseWrapWidth(width);

  if (wrapWidth === null) {
    throw new RangeError("Wrap width must be a positive safe integer.");
  }

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      wrappedLines.push("");
    } else {
      wrappedLines.push(...wrapLine(line, wrapWidth));
    }
  }

  return wrappedLines.join("\n");
}

function wrapLine(line: string, width: number): string[] {
  const words = line.trim().split(/\s+/);
  const wrappedLines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine === "") {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= width) {
      currentLine += ` ${word}`;
    } else {
      wrappedLines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine !== "") {
    wrappedLines.push(currentLine);
  }

  return wrappedLines;
}

export function parseWrapWidth(value: string | number) {
  const result = v.safeParse(WrapWidthSchema, value);

  if (!result.success) {
    return null;
  }

  if (result.output < MIN_WRAP_WIDTH || result.output > MAX_WRAP_WIDTH) {
    return null;
  }

  return result.output;
}
