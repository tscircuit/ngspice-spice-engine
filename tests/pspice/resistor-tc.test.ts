import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE comma-separated resistor TC syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("resistor-tc.cir")
  const regular = expectPspiceFixtureToReportError("resistor-tc.cir", {
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
            4.999999999999994,
            4.999999999999993,
            4.999999999999993,
            4.999999999999993,
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
      r1 in out 1k tc=0.01,0.001
      unknown parameter (0.001) 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
