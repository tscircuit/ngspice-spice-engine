import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE VALUE current sources", () => {
  const output = expectPspiceFixtureToRun("value-current-source.cir")

  expect(output).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 1,
          "firstVoltages": [
            0,
            -0.00628313179728763,
            -0.012565993544691203,
            -0.018848368376081576,
            -0.02512999910616204,
          ],
          "name": "out",
          "pointCount": 1001,
          "startTimeMs": 0,
          "timePerStep": 0.001,
        },
      ],
    }
  `)
})
