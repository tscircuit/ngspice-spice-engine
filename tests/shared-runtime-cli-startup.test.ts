import { expect, test } from "bun:test"
import { fileURLToPath } from "node:url"

test("shared runtime initialization keeps an asynchronous CLI action alive", () => {
  const run = Bun.spawnSync(
    [
      process.execPath,
      "-e",
      'import {getNgspiceSimulation} from "./lib"; getNgspiceSimulation().then(() => console.log("engine-ready"))',
    ],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdout: "pipe",
      stderr: "pipe",
      timeout: 20000,
    },
  )
  expect(run.exitCode).toBe(0)
  expect(new TextDecoder().decode(run.stdout)).toContain("engine-ready")
}, 25000)
