import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports unsupported PSPICE TABLE source syntax", () => {
  const run = expectPspiceFixtureToReportError("table-source.cir")

  expect(run.stderr).toMatchInlineSnapshot(`
    "Error on line 4 or its substitute:
      ae1 %v(e1_int2) %v(e1_int1) xfer_e1
     unknown device type - error 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
