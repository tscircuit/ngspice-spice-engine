import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE VSWITCH model syntax", () => {
  const output = expectPspiceFixtureToRun("vswitch-model.cir")

  expect(output).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0.004995004995004995,
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
})
