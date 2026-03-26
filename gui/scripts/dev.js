#!/usr/bin/env node
/**
 * Cross-platform dev entry: build sidecar once, then run the static UI server.
 */
const { spawn, spawnSync } = require("child_process");
const path = require("path");

const scriptsDir = __dirname;
const build = spawnSync(process.execPath, [path.join(scriptsDir, "build-sidecar.js")], {
  stdio: "inherit",
  shell: false,
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const server = spawn(process.execPath, [path.join(scriptsDir, "dev-server.js")], {
  stdio: "inherit",
  shell: false,
});
server.on("exit", (code) => process.exit(code ?? 0));
