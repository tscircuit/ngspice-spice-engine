import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderSimulationSnapshot } from "../fixtures/render-simulation-snapshot"

test("reversed PSpice switch resistance", async () => {
  const engine = await createNgspiceSpiceEngine()
  const { simulationResultCircuitJson } = await engine.simulate(
    await readFile(
      new URL(
        "../fixtures/pspice/reversed-switch-resistance.cir",
        import.meta.url,
      ),
      "utf8",
    ),
  )

  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson,
      name: "3-V source through a reversed-resistance output switch into 1 kohm",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 15_000)
