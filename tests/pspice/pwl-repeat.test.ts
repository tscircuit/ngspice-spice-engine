import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports unsupported PSPICE PWL REPEAT syntax", () => {
  const run = expectPspiceFixtureToReportError("pwl-repeat.cir")

  expect(run.stderr).toMatchInlineSnapshot(`
    "Error on line 3 or its substitute:
      v1 in 0 pwl repeat forever (0 0 1u 1 2u 0) endrepeat
    parameter value out of range or the wrong type
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
