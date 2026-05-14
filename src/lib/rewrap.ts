export const DEFAULT_LINE_WIDTH = 72;

export function rewrap(text: string, width = DEFAULT_LINE_WIDTH): string {
  if (!Number.isInteger(width) || width < 1) {
    throw new RangeError("Line width must be a positive integer.");
  }

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      wrappedLines.push("");
    } else {
      wrappedLines.push(...wrapLine(line, width));
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
