import { expect, test } from "bun:test"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"
import { renderSimulationSnapshot } from "./fixtures/render-simulation-snapshot"

test("resamples a dense RC transient", () => {
  const spice = `* RC step response
V1 in 0 PULSE(0 5 0 1n 1n 4m 8m)
R1 in out 1k
C1 out 0 100n
.print tran v(out)
.tran 1u 2m UIC
.end`
  // Analytic RC samples isolate interpolation work from ngspice solving.
  const timestamps = Array.from({ length: 2001 }, (_, i) => i * 1e-6)
  let timeReads = 0
  const countedTimestamps = new Proxy(timestamps, {
    get(timestamps, property, receiver) {
      if (typeof property === "string" && /^\d+$/.test(property)) {
        timeReads++
      }
      return Reflect.get(timestamps, property, receiver)
    },
  })
  const eecircuitResult: ResultType = {
    header: "5 V step, 1 kohm resistor, 100 nF capacitor",
    numVariables: 2,
    variableNames: ["time", "v(out)"],
    numPoints: timestamps.length,
    dataType: "real",
    data: [
      { name: "time", type: "time", values: countedTimestamps },
      {
        name: "v(out)",
        type: "voltage",
        values: timestamps.map((time) => 5 * (1 - Math.exp(-time / 1e-4))),
      },
    ],
  }

  const graphs = eecircuitResultToSimulationGraphs(eecircuitResult, spice)
  expect(timeReads).toBeGreaterThan(1_000_000)
  const circuitJson = simulationGraphsToCircuitJson(graphs, spice)
  const voltageGraph = circuitJson.find(
    (result) => result.type === "simulation_transient_voltage_graph",
  )!
  expect(voltageGraph.voltage_levels).toHaveLength(2001)
  expect(voltageGraph.voltage_levels.at(-1)).toBeCloseTo(5, 3)
  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson: circuitJson,
      name: `RC transient: ${timeReads} source timestamp reads`,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
