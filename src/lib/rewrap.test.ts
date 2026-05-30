import { describe, expect, it } from "vitest";

import {
  DEFAULT_WRAP_WIDTH,
  MAX_WRAP_WIDTH,
  MIN_WRAP_WIDTH,
  parseWrapWidth,
  rewrap,
} from "./rewrap";

describe("rewrap", () => {
  it("wraps text on whitespace at the requested width", () => {
    expect(rewrap("This is a long line that should wrap cleanly.", 18)).toBe(
      "This is a long\nline that should\nwrap cleanly.",
    );
  });

  it("uses a 72 character default width", () => {
    expect(DEFAULT_WRAP_WIDTH).toBe(72);
    expect(
      rewrap(
        "This sentence is intentionally long enough to wrap when the default line width is used.",
      ),
    ).toBe(
      [
        "This sentence is intentionally long enough to wrap when the default line",
        "width is used.",
      ].join("\n"),
    );
  });

  it("wraps paragraphs independently", () => {
    const input = [
      "First paragraph has enough words to wrap over more than one line.",
      "",
      "Second paragraph should wrap separately and not get merged.",
    ].join("\n");

    expect(rewrap(input, 28)).toBe(
      [
        "First paragraph has enough",
        "words to wrap over more than",
        "one line.",
        "",
        "Second paragraph should wrap",
        "separately and not get",
        "merged.",
      ].join("\n"),
    );
  });

  it("preserves repeated blank lines between paragraphs", () => {
    expect(rewrap("One two three\n\n\nFour five six", 8)).toBe(
      "One two\nthree\n\n\nFour\nfive six",
    );
  });

  it("preserves existing line breaks", () => {
    expect(rewrap("dddd\ndfd")).toBe("dddd\ndfd");
    expect(rewrap("This line\ncontinues as another line.", 20)).toBe(
      "This line\ncontinues as another\nline.",
    );
  });

  it("collapses repeated whitespace inside lines", () => {
    expect(rewrap("  Extra    spaces\tcollapse   here.  ", 16)).toBe(
      "Extra spaces\ncollapse here.",
    );
  });

  it("leaves words longer than the width intact", () => {
    expect(rewrap("short supercalifragilisticexpialidocious word", 10)).toBe(
      "short\nsupercalifragilisticexpialidocious\nword",
    );
  });

  it("normalizes whitespace-only lines to blank lines", () => {
    expect(rewrap("   \n\t")).toBe("\n");
  });

  it("normalizes carriage return line endings", () => {
    expect(rewrap("One two three\r\nfour five six\rseven eight nine", 18)).toBe(
      "One two three\nfour five six\nseven eight nine",
    );
  });

  it("requires a positive integer width", () => {
    expect(() => rewrap("text", 0)).toThrow(RangeError);
    expect(() => rewrap("text", 1.5)).toThrow(RangeError);
  });
});

describe("parseWrapWidth", () => {
  it("accepts positive integer numbers and digit strings", () => {
    expect(parseWrapWidth(72)).toBe(72);
    expect(parseWrapWidth("72")).toBe(72);
    expect(parseWrapWidth("0072")).toBe(72);
    expect(parseWrapWidth(MIN_WRAP_WIDTH)).toBe(MIN_WRAP_WIDTH);
    expect(parseWrapWidth(MAX_WRAP_WIDTH)).toBe(MAX_WRAP_WIDTH);
  });

  it("rejects values outside the supported range", () => {
    expect(parseWrapWidth(0)).toBeNull();
    expect(parseWrapWidth(-1)).toBeNull();
    expect(parseWrapWidth(MAX_WRAP_WIDTH + 1)).toBeNull();
  });

  it("rejects width input that is not plain digits", () => {
    expect(parseWrapWidth("")).toBeNull();
    expect(parseWrapWidth("72.5")).toBeNull();
    expect(parseWrapWidth("1e3")).toBeNull();
    expect(parseWrapWidth(" 72")).toBeNull();
  });
});
