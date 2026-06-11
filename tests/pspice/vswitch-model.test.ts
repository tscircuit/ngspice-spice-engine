import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE VSWITCH model syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("vswitch-model.cir")
  const regular = expectPspiceFixtureToReportError("vswitch-model.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            4.9504950495049505,
            4.9504950495049505,
            4.9504950495049505,
            4.9504950495049505,
            4.9504950495049505,
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
    "warning, model type mismatch in line
        s1 src out ctrl 0 swmod
    Error on line 4 or its substitute:
      s1 src out ctrl 0 swmod
    Unable to find definition of model swmod
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
