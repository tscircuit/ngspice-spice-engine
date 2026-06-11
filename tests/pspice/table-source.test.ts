import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports PSPICE TABLE source syntax failure with and without compat mode", () => {
  const compat = expectPspiceFixtureToReportError("table-source.cir")
  const regular = expectPspiceFixtureToReportError("table-source.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat.stderr).toMatchInlineSnapshot(`
    "Error on line 3 or its substitute:
      ae1 %v(e1_int2) %v(e1_int1) xfer_e1
     unknown device type - error 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
  expect(regular.stderr).toMatchInlineSnapshot(`
    "Error on line 3 or its substitute:
      ae1 %v(e1_int2) %v(e1_int1) xfer_e1
     unknown device type - error 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
