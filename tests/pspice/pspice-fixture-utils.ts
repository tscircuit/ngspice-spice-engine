import { expect } from "bun:test"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

export interface PspiceFixtureRun {
  status: number | null
  stdout: string
  stderr: string
  output: {
    graphCount: number
    graphs: Array<{
      name: string
      pointCount: number
      startTimeMs: number
      endTimeMs: number
      timePerStep: number
      firstVoltages: number[]
    }>
  } | null
}

export const runPspiceFixture = (
  fixtureName: string,
  options?: { withoutPspiceCompat?: boolean },
): PspiceFixtureRun => {
  const args = [
    join(import.meta.dir, "run-pspice-fixture.ts"),
    join(import.meta.dir, "../fixtures/pspice", fixtureName),
  ]

  if (options?.withoutPspiceCompat) {
    args.push("--without-pspice-compat")
  }

  const result = spawnSync(process.execPath, args, {
    cwd: join(import.meta.dir, "../.."),
    encoding: "utf8",
    timeout: 10_000,
  })

  const stdout = result.stdout.trim()
  const stderr = result.stderr.trim()
  const lastStdoutLine = stdout.split("\n").at(-1)

  return {
    status: result.status,
    stdout,
    stderr,
    output: lastStdoutLine ? JSON.parse(lastStdoutLine) : null,
  }
}

export const expectPspiceFixtureToRun = (
  fixtureName: string,
  options?: { withoutPspiceCompat?: boolean },
) => {
  const run = runPspiceFixture(fixtureName, options)

  expect(run.status).toBe(0)
  expect(run.output).not.toBeNull()
  expect(run.output!.graphCount).toBeGreaterThan(0)
  expect(run.output!.graphs[0]!.pointCount).toBeGreaterThan(0)

  return run.output!
}

export const expectPspiceFixtureToReportError = (
  fixtureName: string,
  options?: { withoutPspiceCompat?: boolean },
) => {
  const run = runPspiceFixture(fixtureName, options)

  expect(run.status).toBe(0)
  expect(run.output).not.toBeNull()
  expect(run.output!.graphCount).toBe(0)
  expect(run.stderr.length).toBeGreaterThan(0)

  return run
}
