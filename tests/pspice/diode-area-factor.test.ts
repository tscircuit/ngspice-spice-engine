import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE diode area factor syntax", () => {
  const output = expectPspiceFixtureToRun("diode-area-factor.cir")

  expect(output).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            9.294726687457795e-23,
            0.6708956209233046,
            0.6709141366344207,
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
})
