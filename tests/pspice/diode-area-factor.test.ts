import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE diode area factor syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("diode-area-factor.cir")
  const regular = expectPspiceFixtureToReportError("diode-area-factor.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0.00000000000000000000009294725731914196,
            0.6708158736635628,
            0.6709141366352547,
            0.6709141366365712,
            0.6709141366365712,
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
    "Error on line 4 or its substitute:
      d1 in out dmod 2
    could not find a valid modelname
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
