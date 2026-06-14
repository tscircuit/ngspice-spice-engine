import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE TABLE source syntax", () => {
  const output = expectPspiceFixtureToRun("table-source.cir")

  expect(output).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0.05000000000000002,
            2.9749999999999996,
            2.9749999999999996,
            2.9749999999999996,
            2.9749999999999996,
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
