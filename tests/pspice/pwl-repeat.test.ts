import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  runPspiceFixture,
} from "./pspice-fixture-utils"

test("reports PSPICE PWL REPEAT syntax failure with and without compat mode", () => {
  const compat = runPspiceFixture("pwl-repeat.cir")
  const regular = expectPspiceFixtureToReportError("pwl-repeat.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat.status).toBe(1)
  expect(compat.output).toBeNull()
  expect(compat.stderr).toContain("Native ngspice PSPICE simulation failed")
  expect(compat.stderr).toContain("parameter value out of range")
  expect(regular.stderr).toMatchInlineSnapshot(`
    "Error on line 2 or its substitute:
      v1 in 0 pwl repeat forever (0 0 1u 1 2u 0) endrepeat
    parameter value out of range or the wrong type
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
