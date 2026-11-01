import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { releaseNotes } from "./release-notes.mjs";

const changelog = `# Changelog

## [1.1.0] - 2026-02-01

### Novidades

- Nova

## [1.0.0] - 2026-01-01

- Primeira
`;

describe("releaseNotes", () => {
  it("returns only the section of that version, keeping its subheadings", () => {
    expect(releaseNotes(changelog, "1.1.0")).toBe("### Novidades\n\n- Nova");
  });

  it("reads the last section up to the end of the file", () => {
    expect(releaseNotes(changelog, "1.0.0")).toBe("- Primeira");
  });

  it("returns null for a version that is not there, even with a similar number", () => {
    expect(releaseNotes(changelog, "1.0")).toBeNull();
    expect(releaseNotes(changelog, "2.0.0")).toBeNull();
  });

  it("returns null for a section with no text", () => {
    expect(releaseNotes("## [1.0.0]\n\n## [0.9.0]\n\n- Antiga\n", "1.0.0")).toBeNull();
  });

  it("handles Windows line endings", () => {
    expect(releaseNotes("## [1.0.0]\r\n\r\n- Um\r\n- Dois\r\n", "1.0.0")).toBe("- Um\n- Dois");
  });

  it("finds the notes of the current app version in the real CHANGELOG.md", () => {
    const { version } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(releaseNotes(readFileSync("CHANGELOG.md", "utf8"), version)).not.toBeNull();
  });
});
