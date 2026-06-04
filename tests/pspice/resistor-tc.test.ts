import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports unsupported PSPICE comma-separated resistor TC syntax", () => {
  const run = expectPspiceFixtureToReportError("resistor-tc.cir")

  expect(run.stderr).toMatchInlineSnapshot(`
    "Error on line 5 or its substitute:
      r1 in out 1k tc=0.01,0.001
      unknown parameter (0.001) 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
