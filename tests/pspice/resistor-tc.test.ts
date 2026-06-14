import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE comma-separated resistor TC syntax", () => {
  const output = expectPspiceFixtureToRun("resistor-tc.cir")

  expect(output).toMatchInlineSnapshot(`
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
})
