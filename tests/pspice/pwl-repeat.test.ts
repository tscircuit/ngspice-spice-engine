import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports PSPICE PWL REPEAT syntax failure", () => {
  const output = expectPspiceFixtureToReportError("pwl-repeat.cir")

  expect(output.stderr).toMatchInlineSnapshot(`
    "Error on line 2 or its substitute:
      v1 in 0 pwl repeat forever (0 0 1u 1 2u 0) endrepeat
    parameter value out of range or the wrong type
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
