import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports PSPICE VSWITCH model syntax failure with and without compat mode", () => {
  const compat = expectPspiceFixtureToReportError("vswitch-model.cir")
  const regular = expectPspiceFixtureToReportError("vswitch-model.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat.stderr).toMatchInlineSnapshot(`
    "Error on line 4 or its substitute:
      as1 %gd(ctrl 0) %gd(src out) aswmod
     unknown device type - error 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
  expect(regular.stderr).toMatchInlineSnapshot(`
    "warning, model type mismatch in line
        s1 src out ctrl 0 swmod
    Error on line 4 or its substitute:
      s1 src out ctrl 0 swmod
    Unable to find definition of model swmod
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
