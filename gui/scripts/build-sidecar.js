#!/usr/bin/env node
/**
 * Cross-platform: build the obsidenc CLI as a release binary and copy it into
 * src-tauri/bin/ for Tauri external sidecar bundling.
 *
 * Resolves repo root as ../../ from this file (gui/scripts -> repo root).
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function getHostTriple() {
  const r = spawnSync("rustc", ["-vV"], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) {
    throw new Error("rustc -vV failed; ensure Rust is installed and on PATH.");
  }
  const line = r.stdout.split(/\r?\n/).find((l) => /^host:\s*/i.test(l));
  if (!line) {
    throw new Error("Could not parse host triple from rustc -vV (no host: line).");
  }
  const parts = line.split(":", 2);
  return parts[1].trim();
}

const targetTriple =
  process.env.TAURI_ENV_TARGET_TRIPLE ||
  process.env.TARGET ||
  process.env.CARGO_BUILD_TARGET ||
  getHostTriple();

const repoRoot = path.resolve(__dirname, "..", "..");
const guiRoot = path.resolve(__dirname, "..");
const tauriRoot = path.join(guiRoot, "src-tauri");
const binDir = path.join(tauriRoot, "bin");

fs.mkdirSync(binDir, { recursive: true });

console.log(`Building obsidenc sidecar for ${targetTriple}...`);

const cargoArgs = [
  "build",
  "--manifest-path",
  path.join(repoRoot, "Cargo.toml"),
  "--bin",
  "obsidenc",
  "--release",
  "--locked",
  "--target",
  targetTriple,
];

const build = spawnSync("cargo", cargoArgs, { stdio: "inherit" });
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const isWin = os.platform() === "win32";
const builtName = isWin ? "obsidenc.exe" : "obsidenc";
const builtPath = path.normalize(path.join(repoRoot, "target", targetTriple, "release", builtName));

if (!fs.existsSync(builtPath)) {
  console.error(
    `Built obsidenc binary not found at:\n  ${builtPath}\n` +
      `Expected release output for target ${targetTriple}. Check cargo build errors above.`
  );
  process.exit(1);
}

const sidecarName = isWin ? `obsidenc-${targetTriple}.exe` : `obsidenc-${targetTriple}`;
const sidecarPath = path.join(binDir, sidecarName);
fs.copyFileSync(builtPath, sidecarPath);
console.log(`Sidecar ready: ${sidecarPath}`);
