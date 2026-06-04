import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs PSPICE VALUE voltage sources", () => {
  const output = expectPspiceFixtureToRun("value-voltage-source.cir")

  expect(output).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 1,
          "firstVoltages": [
            0,
            0.01884939539186289,
            0.03769798063407361,
            0.05654510512824473,
            0.07538999731848613,
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
