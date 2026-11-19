import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderSimulationSnapshot } from "../fixtures/render-simulation-snapshot"

test("PSpice whitespace in a subcircuit pin initial condition", async () => {
  const engine = await createNgspiceSpiceEngine()
  const { simulationResultCircuitJson } = await engine.simulate(
    await readFile(
      new URL(
        "../fixtures/pspice/initial-condition-node-whitespace.cir",
        import.meta.url,
      ),
      "utf8",
    ),
  )

  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson,
      name: "Initial condition: output should discharge from 2 V through 1 kohm / 1 uF",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 15_000)
