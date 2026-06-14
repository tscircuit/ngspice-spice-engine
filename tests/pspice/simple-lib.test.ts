import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE simple .lib syntax", () => {
  const output = expectPspiceFixtureToRun("simple-lib.cir")

  expect(output).toMatchInlineSnapshot(`
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
})
