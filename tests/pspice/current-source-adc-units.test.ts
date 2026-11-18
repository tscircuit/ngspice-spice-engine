import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("interprets the PSpice Adc suffix as amperes", () => {
  const output = expectPspiceFixtureToRun("current-source-adc-units.cir")

  expect(output.graphs[0]!.firstVoltages[0]).toBeCloseTo(1, 6)
})
