import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { exePdbId, pdbId, pdbMatches } from "./pdb-match.mjs";

const GUID = Buffer.from("00112233445566778899aabbccddeeff", "hex");
const OTHER = Buffer.from("ffeeddccbbaa99887766554433221100", "hex");

/** A minimal 64-bit PE with one section holding a CodeView (RSDS) debug entry. */
function fakeExe(guid, age) {
  const exe = Buffer.alloc(0x400);
  const pe = 0x80;
  exe.writeUInt32LE(pe, 0x3c);
  exe.write("PE\0\0", pe, "latin1");
  exe.writeUInt16LE(1, pe + 6); // one section
  exe.writeUInt16LE(240, pe + 20); // optional header size
  const opt = pe + 24;
  exe.writeUInt16LE(0x20b, opt); // PE32+
  exe.writeUInt32LE(0x1000, opt + 112 + 6 * 8); // debug directory RVA
  exe.writeUInt32LE(28, opt + 112 + 6 * 8 + 4);
  const section = opt + 240;
  exe.writeUInt32LE(0x200, section + 8); // virtual size
  exe.writeUInt32LE(0x1000, section + 12); // virtual address
  exe.writeUInt32LE(0x200, section + 20); // file offset
  exe.writeUInt32LE(2, 0x200 + 12); // CodeView
  exe.writeUInt32LE(0x240, 0x200 + 24); // where the RSDS record is in the file
  exe.write("RSDS", 0x240, "latin1");
  guid.copy(exe, 0x244);
  exe.writeUInt32LE(age, 0x254);
  return exe;
}

/** A minimal MSF 7.0 file whose stream 1 holds the PDB info (version, signature, age, GUID). */
function fakePdb(guid, age) {
  const block = 512;
  const pdb = Buffer.alloc(block * 5);
  pdb.write("Microsoft C/C++ MSF 7.00\r\n\x1aDS\0\0\0", 0, "latin1");
  pdb.writeUInt32LE(block, 32);
  pdb.writeUInt32LE(4 * 4, 44); // directory size: stream count, 2 sizes and stream 1's block
  pdb.writeUInt32LE(2, 52); // block 2 holds the list of directory blocks
  pdb.writeUInt32LE(3, block * 2); // the directory is in block 3
  const dir = block * 3;
  pdb.writeUInt32LE(2, dir); // two streams
  pdb.writeUInt32LE(0, dir + 4); // stream 0: empty
  pdb.writeUInt32LE(28, dir + 8); // stream 1: 28 bytes
  pdb.writeUInt32LE(4, dir + 12); // stream 1 lives in block 4
  pdb.writeUInt32LE(20000404, block * 4);
  pdb.writeUInt32LE(age, block * 4 + 8);
  guid.copy(pdb, block * 4 + 12);
  return pdb;
}

describe("pdb-match", () => {
  it("reads the identifier the .exe expects and the one the .pdb has", () => {
    expect(exePdbId(fakeExe(GUID, 3))).toEqual({
      guid: GUID.toString("hex").toUpperCase(),
      age: 3,
    });
    expect(pdbId(fakePdb(GUID, 3))).toEqual({ guid: GUID.toString("hex").toUpperCase(), age: 3 });
  });

  it("accepts the .pdb of the same build", () => {
    expect(pdbMatches(fakeExe(GUID, 1), fakePdb(GUID, 1))).toBe(true);
  });

  it("refuses a .pdb from another build", () => {
    expect(pdbMatches(fakeExe(GUID, 1), fakePdb(OTHER, 1))).toBe(false);
  });

  it("refuses a .pdb older than the .exe", () => {
    expect(pdbMatches(fakeExe(GUID, 2), fakePdb(GUID, 1))).toBe(false);
  });

  it("refuses files that are not an .exe or a .pdb", () => {
    expect(exePdbId(Buffer.alloc(0x400))).toBeNull();
    expect(pdbId(Buffer.from("not a pdb at all".padEnd(64)))).toBeNull();
  });
});
