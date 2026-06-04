import { expect, test } from "bun:test"
import {
  expectPspiceFixtureToReportError,
  expectPspiceFixtureToRun,
} from "./pspice-fixture-utils"

test("runs PSPICE logical and operator syntax only with compat mode", () => {
  const compat = expectPspiceFixtureToRun("logical-and-operator.cir")
  const regular = expectPspiceFixtureToReportError("logical-and-operator.cir", {
    withoutPspiceCompat: true,
  })

  expect(compat).toMatchInlineSnapshot(`
    {
      "graphCount": 1,
      "graphs": [
        {
          "endTimeMs": 0.019999999999999997,
          "firstVoltages": [
            0,
            1,
            1,
            1,
            1,
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
      b1 out 0 v= ( v(a) >   5.0000000000e-01 ) & ( v(b) >   5.0000000000e-01 )
      unknown parameter (&) 
        Simulation interrupted due to error!

    Error: circuit not parsed."
  `)
})
