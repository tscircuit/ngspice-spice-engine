import { expect, test } from "bun:test"
import { expectPspiceFixtureToRun } from "./pspice-fixture-utils"

test("runs TPS63802 PSPICE VALUE expression with spaced caret XNOR operator", () => {
  const output = expectPspiceFixtureToRun("tps63802-xnor-spaced-caret.cir")

  expect(output.graphCount).toBe(1)
  expect(output.graphs[0]!.name).toBe("out")
  expect(output.graphs[0]!.pointCount).toBeGreaterThan(0)
  expect(Math.min(...output.graphs[0]!.firstVoltages)).toBeLessThan(0.1)
  expect(Math.max(...output.graphs[0]!.firstVoltages)).toBeGreaterThan(0.9)
})
