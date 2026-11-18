import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"
import { renderSimulationSnapshot } from "./fixtures/render-simulation-snapshot"

test("transient input ends at 2 ms but the requested output ends at 10 ms", () => {
  const result: ResultType = {
    header: "Transient stopped before the requested end time",
    numVariables: 2,
    variableNames: ["time", "v(out)"],
    numPoints: 3,
    dataType: "real",
    data: [
      { name: "time", type: "time", values: [0, 0.001, 0.002] },
      { name: "v(out)", type: "voltage", values: [0, 2.7, 2.8] },
    ],
  }

  const spice = "* Truncated startup\n.print tran V(out)\n.tran 1m 10m\n.end"
  let simulationResultCircuitJson: CircuitJson
  try {
    simulationResultCircuitJson = simulationGraphsToCircuitJson(
      eecircuitResultToSimulationGraphs(result, spice),
      spice,
    )
  } catch (error) {
    if (!(error instanceof Error)) throw error
    expect(error.message).toMatch(/stopped.*before.*requested/i)
    simulationResultCircuitJson = [
      {
        type: "simulation_unknown_experiment_error",
        simulation_unknown_experiment_error_id: "truncated_startup",
        error_type: "simulation_unknown_experiment_error",
        message: error.message,
      },
    ]
  }

  expect(
    renderSimulationSnapshot({
      simulationResultCircuitJson,
      name: "Input stops at 2 ms; requested end is 10 ms",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
