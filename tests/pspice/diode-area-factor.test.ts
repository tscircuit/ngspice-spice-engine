import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports PSPICE diode area factor syntax failure with and without compat mode", () => {
  const compat = expectPspiceFixtureToReportError("diode-area-factor.cir")
  const regular = expectPspiceFixtureToReportError("diode-area-factor.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat.stderr).toMatchInlineSnapshot(`
    "Error on line 4 or its substitute:
      d1 in out dmod 2
    could not find a valid modelname
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
  expect(regular.stderr).toMatchInlineSnapshot(`
    "Error on line 4 or its substitute:
      d1 in out dmod 2
    could not find a valid modelname
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
