import { expect, test } from "bun:test"
import { fileURLToPath } from "node:url"

test("snapshots the startup timeout shown when WASM never initializes", async () => {
  const run = Bun.spawn(
    [
      process.execPath,
      "-e",
      `import {mock} from "bun:test";
mock.module("./lib/import-eecircuit-engine", () => ({
  importEecircuitEngine: async () => ({Simulation: class {
    start() { return new Promise(() => {}) }
  }}),
}));
const {getNgspiceSimulation} = await import("./lib/get-ngspice-simulation");
try { await getNgspiceSimulation(); process.exit(0) }
catch (error) { console.error(error.message); process.exit(1) }`,
    ],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdout: "pipe",
      stderr: "pipe",
    },
  )
  const [exitCode, stdout, stderr] = await Promise.all([
    run.exited,
    new Response(run.stdout).text(),
    new Response(run.stderr).text(),
  ])
  expect(stderr.trim()).toBe(
    "ngspice initialization timed out after 15 seconds",
  )
  expect({
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  }).toMatchInlineSnapshot(`
    {
      "exitCode": 1,
      "stderr": "ngspice initialization timed out after 15 seconds",
      "stdout": "",
    }
  `)
}, 25000)
