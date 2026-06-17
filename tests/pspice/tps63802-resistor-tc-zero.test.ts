import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs TPS63802 PSPICE resistor TC=0,0 syntax", () => {
  const output = expectPspiceFixtureToRun("tps63802-resistor-tc-zero.cir")

  expect(output.graphCount).toBe(1)
  expect(output.graphs[0]!.name).toBe("out")
  expect(output.graphs[0]!.pointCount).toBeGreaterThan(0)
})
