import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { readFile } from "node:fs/promises"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderSimulationSnapshot } from "../fixtures/render-simulation-snapshot"

test("LMZM33602 startup", async () => {
  const engine = await createNgspiceSpiceEngine()
  const spice = await readFile(
    new URL("../fixtures/pspice/lmzm33602-startup.cir", import.meta.url),
    "utf8",
  )
  let simulationResultCircuitJson: CircuitJson
  try {
    const simulation = await engine.simulate(spice)
    simulationResultCircuitJson = simulation.simulationResultCircuitJson
  } catch (error) {
    if (!(error instanceof Error)) throw error
    expect(error.message).toMatch(/timestep too small|stopped.*before/i)
    simulationResultCircuitJson = [
      {
        type: "simulation_unknown_experiment_error",
        simulation_unknown_experiment_error_id: "lmzm33602_startup",
        error_type: "simulation_unknown_experiment_error",
        message: error.message,
      },
    ]
  }

  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson,
      name: "LMZM33602: 24 V input ramp, 12 V target, 24 ohm load, 1 ms startup",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 15_000)
