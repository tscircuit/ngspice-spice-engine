import { expect, test } from "bun:test"
import { expectPspiceFixtureToReportError } from "./pspice-fixture-utils"

test("reports PSPICE simple .lib syntax failure with and without compat mode", () => {
  const compat = expectPspiceFixtureToReportError("simple-lib.cir")
  const regular = expectPspiceFixtureToReportError("simple-lib.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat.stderr).toMatchInlineSnapshot(`
    "Error on line 2 or its substitute:
      .lib modelcard.cmos90
     unimplemented dot command '.lib'
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
  expect(regular.stderr).toMatchInlineSnapshot(`
    "Error on line 2 or its substitute:
      .lib modelcard.cmos90
     unimplemented dot command '.lib'
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
