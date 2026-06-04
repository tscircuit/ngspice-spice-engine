import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE simple .lib syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("simple-lib.cir")
  const regular = expectPspiceFixtureToReportError("simple-lib.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            5,
            4.9999999999999885,
            4.999999999999988,
            4.999999999999988,
            4.999999999999988,
          ],
          "name": "out",
          "pointCount": 21,
          "startTimeMs": 0,
          "timePerStep": 0.001,
        },
      ],
    }
  `)
  expect(regular.stderr).toMatchInlineSnapshot(`
    "Error on line 2 or its substitute:
      .lib modelcard.cmos90
     unimplemented dot command '.lib'
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
