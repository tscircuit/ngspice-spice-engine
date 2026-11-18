import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderSimulationSnapshot } from "../fixtures/render-simulation-snapshot"

test("PSpice Adc source driving one ohm", async () => {
  const engine = await createNgspiceSpiceEngine()
  const { simulationResultCircuitJson } = await engine.simulate(
    await readFile(
      new URL(
        "../fixtures/pspice/current-source-adc-units.cir",
        import.meta.url,
      ),
      "utf8",
    ),
  )

  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson,
      name: "1-Adc timing reference into 1 ohm: expected voltage is 1 V",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 15_000)
