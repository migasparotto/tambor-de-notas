import { describe, expect, it } from "vitest";
import { describeError, MAX_STACK_LINES } from "./errorReport";

describe("describeError", () => {
  it("keeps where, the name, the message and the start of the stack", () => {
    const error = new TypeError("x is undefined");
    error.stack = "TypeError: x is undefined\n    at a (index.js:1:1)\n    at b (index.js:2:2)";
    expect(describeError("tela", error)).toBe(
      "tela: TypeError: x is undefined | at a (index.js:1:1) | at b (index.js:2:2)",
    );
  });

  it("keeps only the first stack lines", () => {
    const error = new Error("boom");
    const frames = Array.from({ length: MAX_STACK_LINES + 4 }, (_, i) => `    at f${i} (x.js)`);
    error.stack = ["Error: boom", ...frames].join("\n");
    expect(describeError("x", error).split(" | ")).toHaveLength(MAX_STACK_LINES + 1);
  });

  it("describes an error without a stack", () => {
    const error = new Error("boom");
    error.stack = undefined;
    expect(describeError("abertura", error)).toBe("abertura: Error: boom");
  });

  it("describes things thrown that are not errors", () => {
    expect(describeError("x", "falhou")).toBe("x: falhou");
    expect(describeError("x", { code: 5 })).toBe('x: {"code":5}');
    expect(describeError("x", undefined)).toBe("x: undefined");
  });
});
