import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { SimulationTransientVoltageGraph } from "circuit-json"
import { createNgspiceSpiceEngine } from "../../lib"

test(
  "runs MSPM0G3507 OPA model with embedded PSPICE preprocessing",
  async () => {
    const spiceEngine = await createNgspiceSpiceEngine({
      pspiceCompatibility: true,
    })
    const spiceString = readFileSync(
      join(import.meta.dir, "../assets/mspm0g3507-opa.cir"),
      "utf8",
    )

    const { simulationResultCircuitJson } =
      await spiceEngine.simulate(spiceString)
    const graph = simulationResultCircuitJson.find(
      (element): element is SimulationTransientVoltageGraph =>
        element.type === "simulation_transient_voltage_graph",
    )

    expect(graph).toBeDefined()
    const voltageLevels = graph!.voltage_levels
    const timestampsMs = graph!.timestamps_ms
    expect(timestampsMs).toBeDefined()
    expect(voltageLevels.length).toBeGreaterThan(0)
    expect(timestampsMs!.length).toBe(voltageLevels.length)
    expect(graph!.time_per_step).toBeGreaterThan(0)
    expect(graph!.end_time_ms).toBeGreaterThan(graph!.start_time_ms)
    expect(voltageLevels.every(Number.isFinite)).toBe(true)
    expect(timestampsMs!.every(Number.isFinite)).toBe(true)
  },
  { timeout: 15_000 },
)
