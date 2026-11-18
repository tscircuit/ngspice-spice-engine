import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("preserves reversed PSpice switch resistance", () => {
  const output = expectPspiceFixtureToRun("reversed-switch-resistance.cir")

  expect(output.graphs[0]!.firstVoltages[0]).toBeCloseTo(3, 6)
})
