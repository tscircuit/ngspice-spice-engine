import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE AKO model syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("ako-model.cir")
  const regular = expectPspiceFixtureToReportError("ako-model.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0.00000000000000000000009294726687457795,
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
  expect(regular.stderr).toMatchInlineSnapshot(`
    "warning, model type mismatch in line
        d1 in out dfast
    Warning: Model issue on line 3 :
      .model dfast ako: dbase d(is=2n) ...
    unknown model type ako: - ignored

    Error on line 5 or its substitute:
      d1 in out dfast
    could not find a valid modelname
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
