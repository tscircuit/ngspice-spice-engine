import { expect, test } from "bun:test"
import {
  createNgspiceSimulation,
  createNgspiceSpiceEngine,
  NGSPICE_ENGINE,
  rewritePspiceCompatibilitySyntax,
} from "../lib"

test("raw consumers and graph consumers share PSpice-compatible initialization", async () => {
  const spice = `* shared runtime
V1 in 0 5
R1 in out 1k TC=0,0
R2 out 0 1k
.print tran v(out)
.tran 1u 2u
.end`
  const rawEngine = await createNgspiceSimulation()
  rawEngine.setNetList(rewritePspiceCompatibilitySyntax(spice))
  const result = await rawEngine.runSim()
  const voltage = result.data.find((series) => series.name === "v(out)")
  expect(voltage?.values.at(-1)).toBeCloseTo(2.5, 8)
  const graphEngine = await createNgspiceSpiceEngine()
  const { simulationResultCircuitJson } = await graphEngine.simulate(spice)
  const graph = simulationResultCircuitJson.find(
    (record) => record.type === "simulation_transient_voltage_graph",
  )
  expect(graph?.type).toBe("simulation_transient_voltage_graph")
  if (graph?.type !== "simulation_transient_voltage_graph")
    throw new Error("Missing output trace")
  expect(graph.voltage_levels.at(-1)).toBeCloseTo(2.5, 8)
  expect(NGSPICE_ENGINE.compatibility).toBe("psa")
  expect(NGSPICE_ENGINE.version).toBe("1.7.6")
}, 15000)
