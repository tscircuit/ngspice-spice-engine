import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE TABLE source syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("table-source.cir")
  const regular = expectPspiceFixtureToReportError("table-source.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0.05000000000000002,
            2.975,
            2.975,
            2.975,
            2.975,
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
    "Error on line 3 or its substitute:
      ae1 %v(e1_int2) %v(e1_int1) xfer_e1
     unknown device type - error 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
