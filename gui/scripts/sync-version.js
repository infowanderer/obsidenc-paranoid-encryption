#!/usr/bin/env node
/**
 * Manual release helper (run explicitly when bumping version):
 *   node scripts/sync-version.js
 *
 * Source of truth: gui/src-tauri/tauri.conf.json -> "version"
 * Updates: gui/src-tauri/Cargo.toml package.version (required for Rust CARGO_PKG_VERSION / get_version)
 *
 * Does not run during normal build.
 */
const fs = require("fs");
const path = require("path");

const tauriRoot = path.resolve(__dirname, "..", "src-tauri");
const tauriConfPath = path.join(tauriRoot, "tauri.conf.json");
const cargoTomlPath = path.join(tauriRoot, "Cargo.toml");

const raw = fs.readFileSync(tauriConfPath, { encoding: "utf8" });
const cfg = JSON.parse(raw);
const version = cfg.version;
if (!version || !/^\d+\.\d+\.\d+$/.test(String(version))) {
  console.error(`Invalid or missing version in ${tauriConfPath}`);
  process.exit(1);
}

const cargo = fs.readFileSync(cargoTomlPath, "utf8");
const lines = cargo.split(/\r?\n/);
const pkgIdx = lines.findIndex((l) => l.trim() === "[package]");
if (pkgIdx === -1) {
  console.error(`No [package] section in ${cargoTomlPath}`);
  process.exit(1);
}
let updated = false;
for (let i = pkgIdx + 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("[")) break;
  if (/^\s*version\s*=\s*"/.test(line) && !/^\s*rust-version\s*=/.test(line)) {
    lines[i] = line.replace(/"[^"]*"/, `"${version}"`);
    updated = true;
    break;
  }
}
if (!updated) {
  console.error(`Failed to find package version line in ${cargoTomlPath}`);
  process.exit(1);
}
fs.writeFileSync(cargoTomlPath, lines.join("\n"), { encoding: "utf8" });
console.log(`sync-version: Cargo.toml package.version = ${version} (from tauri.conf.json)`);
