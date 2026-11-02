// Checks that a .pdb (debug symbols) belongs to an .exe: the linker writes the same identifier
// (GUID and age) in both. Without a matching .pdb, a crash dump cannot be read.
// Usage: node scripts/pdb-match.mjs tambor-de-notas.exe tambor_de_notas.pdb
import { Buffer } from "node:buffer";
import console from "node:console";
import { readFileSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

const hex = (bytes) => Buffer.from(bytes).toString("hex").toUpperCase();

/** Reads the identifier (GUID + age) the .exe expects its .pdb to have, or null. */
export function exePdbId(exe) {
  const pe = exe.readUInt32LE(0x3c);
  if (exe.toString("latin1", pe, pe + 4) !== "PE\0\0") return null;
  const optionalHeader = pe + 24;
  const is64 = exe.readUInt16LE(optionalHeader) === 0x20b;
  const dataDirs = optionalHeader + (is64 ? 112 : 96);
  const debugRva = exe.readUInt32LE(dataDirs + 6 * 8);
  const debugSize = exe.readUInt32LE(dataDirs + 6 * 8 + 4);
  if (debugRva === 0) return null;
  const sections = optionalHeader + exe.readUInt16LE(pe + 20);
  const count = exe.readUInt16LE(pe + 6);
  const toOffset = (rva) => {
    for (let i = 0; i < count; i++) {
      const s = sections + i * 40;
      const va = exe.readUInt32LE(s + 12);
      if (rva >= va && rva < va + exe.readUInt32LE(s + 8))
        return exe.readUInt32LE(s + 20) + rva - va;
    }
    return -1;
  };
  for (let entry = toOffset(debugRva); entry < toOffset(debugRva) + debugSize; entry += 28) {
    if (exe.readUInt32LE(entry + 12) !== 2) continue; // 2 = CodeView
    const cv = exe.readUInt32LE(entry + 24);
    if (exe.toString("latin1", cv, cv + 4) !== "RSDS") continue;
    return { guid: hex(exe.subarray(cv + 4, cv + 20)), age: exe.readUInt32LE(cv + 20) };
  }
  return null;
}

/** Reads the identifier (GUID + age) stored in a .pdb (MSF 7.0), or null. */
export function pdbId(pdb) {
  if (!pdb.toString("latin1", 0, 32).startsWith("Microsoft C/C++ MSF 7.00")) return null;
  const blockSize = pdb.readUInt32LE(32);
  const directorySize = pdb.readUInt32LE(44);
  const blockMap = pdb.readUInt32LE(52) * blockSize;
  const directoryBlocks = Math.ceil(directorySize / blockSize);
  const directory = Buffer.concat(
    Array.from({ length: directoryBlocks }, (_, i) => {
      const at = pdb.readUInt32LE(blockMap + i * 4) * blockSize;
      return pdb.subarray(at, at + blockSize);
    }),
  );
  const streams = directory.readUInt32LE(0);
  const sizes = Array.from({ length: streams }, (_, i) => directory.readUInt32LE(4 + i * 4));
  // Stream 1 (PDB info) starts after the blocks of stream 0.
  const size0 = sizes[0] === 0xffffffff ? 0 : sizes[0]; // 0xFFFFFFFF marks an empty stream
  const firstBlocksOfStream1 = 4 + streams * 4 + Math.ceil(size0 / blockSize) * 4;
  const info = directory.readUInt32LE(firstBlocksOfStream1) * blockSize;
  return { guid: hex(pdb.subarray(info + 12, info + 28)), age: pdb.readUInt32LE(info + 8) };
}

/** True when the .pdb's GUID is the one the .exe expects (the age may only grow). */
export function pdbMatches(exe, pdb) {
  const want = exePdbId(exe);
  const have = pdbId(pdb);
  return Boolean(want && have && want.guid === have.guid && have.age >= want.age);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [exePath, pdbPath] = process.argv.slice(2);
  const exe = readFileSync(exePath);
  const pdb = readFileSync(pdbPath);
  const want = exePdbId(exe);
  const have = pdbId(pdb);
  console.log(`.exe espera: ${want ? `${want.guid} idade ${want.age}` : "nenhum .pdb"}`);
  console.log(`.pdb tem:    ${have ? `${have.guid} idade ${have.age}` : "formato desconhecido"}`);
  if (!pdbMatches(exe, pdb)) {
    console.log(
      `::error::O ${pdbPath} não bate com o ${exePath}: um dump deste .exe não poderia ser lido.`,
    );
    process.exit(1);
  }
  console.log("O .pdb bate com o .exe.");
}
